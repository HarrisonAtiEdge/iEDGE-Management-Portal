import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  MessageSquare,
  CheckCircle,
  Circle,
  User,
  Phone,
  FileText,
  ClipboardList,
  BadgeDollarSign,
  ShieldCheck,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import {
  serverTimestamp,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { useMeetingUpdates } from "@/hooks/useMeetingUpdates";
import { useMeetingUpdateComments } from "@/hooks/useMeetingUpdateComments";
import { createNotification } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import type { SalesRecord } from "@shared/schema";

interface ViewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: SalesRecord;
}

interface ExtraRecordData {
  goal?: string;
  createdAt?: any;
  updatedAt?: any;
  comments?: any[];
  projectCustodians?: string[];
  supervisors?: string[];
  adminParticipantIds?: string[];
  assignedAdminId?: string;
  assignedAdminName?: string;
  projectCode?: string;
  contactPerson?: string;
  contactMobile?: string;
  estimateNumber?: string;
  invoiceNumber?: string;
  paymentRef?: string;
  wonValue?: number | string;
  nextFollowUp?: {
    date?: any;
    actionItems?: string[];
  };
  needHelp?: boolean;
  accessUserIds?: string[];
  canViewUserIds?: string[];
  canCommentUserIds?: string[];
  canManageMeetingUserIds?: string[];
  canEditUserIds?: string[];
  canCreateEstimateUserIds?: string[];
}

interface LinkedCommercialItem {
  id: string;
  source: "estimates" | "estimateInvoices";
  number: string;
  amount: string;
  status?: string;
  createdAt?: any;
  createdByName?: string;
}

function toJsDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (value instanceof Timestamp) {
    const d = value.toDate();
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }

  if (typeof value?.seconds === "number") {
    const d = new Date(value.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function uniqueUserIds(...groups: Array<unknown[] | unknown>) {
  const seen = new Set<string>();
  groups
    .flatMap((group) => (Array.isArray(group) ? group : [group]))
    .forEach((value) => {
      const normalized = String(value || "").trim();
      if (normalized) {
        seen.add(normalized);
      }
    });
  return Array.from(seen);
}

function buildRecordAccessUserIds(recordData: any) {
  return uniqueUserIds(
    recordData?.salesPersonId,
    recordData?.assignedAdminId,
    normalizeStringArray(recordData?.adminParticipantIds),
    normalizeStringArray(recordData?.projectCustodians),
    normalizeStringArray(recordData?.supervisors),
  );
}

function buildEditorUserIds(recordData: any) {
  return uniqueUserIds(
    recordData?.salesPersonId,
    recordData?.assignedAdminId,
    normalizeStringArray(recordData?.adminParticipantIds),
    normalizeStringArray(recordData?.supervisors),
  );
}

function buildMeetingManagerUserIds(recordData: any) {
  return uniqueUserIds(
    buildEditorUserIds(recordData),
    normalizeStringArray(recordData?.projectCustodians),
  );
}

function getRelatedRecipientIds(recordData: any, actorId?: string) {
  return buildRecordAccessUserIds(recordData).filter((id) => id !== actorId);
}

function formatCurrency(value: unknown) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "Rs 0";
  return `Rs ${amount.toLocaleString()}`;
}

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
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

function resolveCommercialNumber(data: any, fallbackId: string) {
  return (
    data?.estimateNumber ||
    data?.estimateNo ||
    data?.invoiceNumber ||
    data?.invoiceNo ||
    data?.quotationNumber ||
    data?.number ||
    fallbackId
  );
}

function resolveCommercialAmount(data: any) {
  const total =
    data?.grandTotal ??
    data?.total ??
    data?.netAmount ??
    data?.amount ??
    data?.finalAmount;
  if (total === undefined || total === null || total === "") return "";
  return String(total);
}

function resolveCommercialStatus(data: any) {
  return data?.status || data?.recordStatus || data?.approvalStatus || "Saved";
}

function resolveCommercialCreatedByName(data: any) {
  return (
    data?.createdByName ||
    data?.createdBy ||
    data?.createdByEmail ||
    data?.salesPersonName ||
    ""
  );
}

export function ViewDetailModal({
  isOpen,
  onClose,
  record,
}: ViewDetailModalProps) {
  const { userProfile, currentUser } = useAuth();
  const actorId = currentUser?.uid || userProfile?.id || "";
  const actorName = userProfile?.displayName || "Unknown User";
  const actorRole = normalizeRole(userProfile?.role);
  const isAdminLike = actorRole.includes("admin");
  const { toast } = useToast();

  const [comment, setComment] = useState("");
  const [meetingComment, setMeetingComment] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );
  const [savingMeetingComment, setSavingMeetingComment] = useState(false);
  const [actioningReimbursement, setActioningReimbursement] = useState<
    "approved" | "rejected" | null
  >(null);
  const [userDirectory, setUserDirectory] = useState<Record<string, string>>(
    {},
  );
  const [extraRecordData, setExtraRecordData] = useState<ExtraRecordData>({});
  const [approvalRemark, setApprovalRemark] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [linkedCommercialItems, setLinkedCommercialItems] = useState<
    LinkedCommercialItem[]
  >([]);
  const [commercialLoading, setCommercialLoading] = useState(false);

  const { meetingUpdates, loading: meetingUpdatesLoading } = useMeetingUpdates(
    record.id,
  );
  const selectedMeeting = meetingUpdates.find(
    (meeting) => meeting.id === selectedMeetingId,
  );

  const {
    comments,
    loading: commentsLoading,
    addComment,
  } = useMeetingUpdateComments(record.id, selectedMeetingId || undefined);

  React.useEffect(() => {
    if (meetingUpdates.length > 0 && !selectedMeetingId) {
      setSelectedMeetingId(meetingUpdates[0].id);
    }
  }, [meetingUpdates, selectedMeetingId]);

  useEffect(() => {
    const reimbursement = (selectedMeeting as any)?.reimbursement;
    setApprovalRemark(
      String(reimbursement?.approvalRemark || reimbursement?.adminRemark || ""),
    );
    setRejectionReason(String(reimbursement?.rejectionReason || ""));
  }, [selectedMeetingId, selectedMeeting]);

  useEffect(() => {
    const fetchDependencies = async () => {
      if (!isOpen || !record?.id) return;

      try {
        const [recordSnap, usersSnap] = await Promise.all([
          getDoc(doc(db, "Panels", "IEDGE-SYSTEM", "salesRecords", record.id)),
          getDocs(collection(db, "Panels", "IEDGE-SYSTEM", "users")),
        ]);

        if (recordSnap.exists()) {
          const data = recordSnap.data();
          setExtraRecordData({
            goal: data.goal,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            comments: Array.isArray(data.comments) ? data.comments : [],
            projectCustodians: normalizeStringArray(data.projectCustodians),
            supervisors: normalizeStringArray(data.supervisors),
            adminParticipantIds: normalizeStringArray(data.adminParticipantIds),
            assignedAdminId: data.assignedAdminId || undefined,
            assignedAdminName: data.assignedAdminName || undefined,
            projectCode: data.projectCode || undefined,
            contactPerson: data.contactPerson || undefined,
            contactMobile: data.contactMobile || undefined,
            estimateNumber: data.estimateNumber || undefined,
            invoiceNumber: data.invoiceNumber || undefined,
            paymentRef: data.paymentRef || undefined,
            wonValue: data.wonValue,
            nextFollowUp: data.nextFollowUp || undefined,
            needHelp: Boolean(data.needHelp),
            accessUserIds: normalizeStringArray(data.accessUserIds),
            canViewUserIds: normalizeStringArray(data.canViewUserIds),
            canCommentUserIds: normalizeStringArray(data.canCommentUserIds),
            canManageMeetingUserIds: normalizeStringArray(
              data.canManageMeetingUserIds,
            ),
            canEditUserIds: normalizeStringArray(data.canEditUserIds),
            canCreateEstimateUserIds: normalizeStringArray(
              data.canCreateEstimateUserIds,
            ),
          });
        }

        const directory: Record<string, string> = {};
        usersSnap.forEach((userDoc) => {
          const data = userDoc.data() as any;
          directory[userDoc.id] =
            data.displayName ||
            data.fullName ||
            data.name ||
            data.email ||
            userDoc.id;
          if (data.id) {
            directory[String(data.id)] =
              data.displayName ||
              data.fullName ||
              data.name ||
              data.email ||
              String(data.id);
          }
        });
        setUserDirectory(directory);
      } catch (error) {
        console.error("Error fetching extra record data:", error);
      }
    };

    fetchDependencies();
  }, [isOpen, record?.id]);

  const effectiveProjectCode =
    extraRecordData.projectCode || (record as any).projectCode || "";

  useEffect(() => {
    if (!isOpen || !effectiveProjectCode) {
      setLinkedCommercialItems([]);
      return;
    }

    let active = true;

    const fetchLinkedCommercialItems = async () => {
      setCommercialLoading(true);
      try {
        const collectionNames: Array<"estimates" | "estimateInvoices"> = [
          "estimates",
          "estimateInvoices",
        ];
        const nextItems: LinkedCommercialItem[] = [];

        for (const collectionName of collectionNames) {
          const snapshot = await getDocs(
            collection(db, "Panels", "IEDGE-SYSTEM", collectionName),
          );

          snapshot.forEach((itemDoc) => {
            const data = itemDoc.data() as any;
            if (!matchesEstimateProjectCode(data, effectiveProjectCode)) return;

            nextItems.push({
              id: itemDoc.id,
              source: collectionName,
              number: resolveCommercialNumber(data, itemDoc.id),
              amount: resolveCommercialAmount(data),
              status: resolveCommercialStatus(data),
              createdAt: data?.createdAt,
              createdByName: resolveCommercialCreatedByName(data),
            });
          });
        }

        if (active) {
          setLinkedCommercialItems(
            nextItems.sort((a, b) => a.number.localeCompare(b.number)),
          );
        }
      } catch (error) {
        console.error("Error loading linked commercial items:", error);
        if (active) {
          setLinkedCommercialItems([]);
        }
      } finally {
        if (active) {
          setCommercialLoading(false);
        }
      }
    };

    fetchLinkedCommercialItems();

    return () => {
      active = false;
    };
  }, [isOpen, effectiveProjectCode]);

  const latestRecordData = useMemo(
    () => ({
      ...record,
      ...extraRecordData,
      projectCustodians: extraRecordData.projectCustodians || [],
      supervisors: extraRecordData.supervisors || [],
      adminParticipantIds: extraRecordData.adminParticipantIds || [],
    }),
    [record, extraRecordData],
  );

  const displayUserList = (ids: string[] = []) => {
    if (!ids.length) return "N/A";
    return ids.map((id) => userDirectory[id] || id).join(", ");
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedComment = comment.trim();
    if (!trimmedComment || !userProfile || !actorId) return;

    const timestamp = new Date();

    try {
      const recordDoc = doc(
        db,
        "Panels",
        "IEDGE-SYSTEM",
        "salesRecords",
        record.id,
      );
      const recordSnap = await getDoc(recordDoc);
      if (!recordSnap.exists()) {
        throw new Error("Record not found");
      }

      const latestRecord = recordSnap.data() as any;
      const existingComments = Array.isArray(latestRecord.comments)
        ? latestRecord.comments
        : [];
      const existingAdminParticipantIds = normalizeStringArray(
        latestRecord.adminParticipantIds,
      );

      const newComment = {
        text: trimmedComment,
        timestamp: timestamp.toISOString(),
        userName: actorName,
        userId: actorId,
      };

      const mergedAdminParticipantIds =
        actorRole !== "sales"
          ? uniqueUserIds(existingAdminParticipantIds, actorId)
          : existingAdminParticipantIds;

      const mergedRecordData = {
        ...latestRecord,
        assignedAdminId:
          actorRole !== "sales"
            ? actorId
            : latestRecord.assignedAdminId || undefined,
        assignedAdminName:
          actorRole !== "sales"
            ? actorName
            : latestRecord.assignedAdminName || undefined,
        adminParticipantIds: mergedAdminParticipantIds,
        projectCustodians: normalizeStringArray(latestRecord.projectCustodians),
        supervisors: normalizeStringArray(latestRecord.supervisors),
      };

      const mergedAccessUserIds = buildRecordAccessUserIds(mergedRecordData);
      const canEditUserIds = buildEditorUserIds(mergedRecordData);
      const canManageMeetingUserIds =
        buildMeetingManagerUserIds(mergedRecordData);
      const canCreateEstimateUserIds = canEditUserIds;

      await updateDoc(recordDoc, {
        comments: [...existingComments, newComment],
        updatedAt: serverTimestamp(),
        assignedAdminId: mergedRecordData.assignedAdminId ?? null,
        assignedAdminName: mergedRecordData.assignedAdminName ?? null,
        adminParticipantIds: mergedAdminParticipantIds,
        accessUserIds: mergedAccessUserIds,
        canViewUserIds: mergedAccessUserIds,
        canCommentUserIds: mergedAccessUserIds,
        canManageMeetingUserIds,
        canEditUserIds,
        canCreateEstimateUserIds,
      });

      const recipientIds = getRelatedRecipientIds(mergedRecordData, actorId);
      for (const recipientId of recipientIds) {
        await createNotification({
          recipientId,
          type: "comment",
          recordId: record.id,
          message: `${actorName} commented on Project ${latestRecord.projectName || record.projectName}: "${trimmedComment.substring(0, 50)}${trimmedComment.length > 50 ? "..." : ""}"`,
          createdById: actorId,
          createdByName: actorName,
        });
      }

      setExtraRecordData((prev) => ({
        ...prev,
        comments: [...(prev.comments || existingComments), newComment],
        assignedAdminId: mergedRecordData.assignedAdminId,
        assignedAdminName: mergedRecordData.assignedAdminName,
        adminParticipantIds: mergedAdminParticipantIds,
        accessUserIds: mergedAccessUserIds,
        canViewUserIds: mergedAccessUserIds,
        canCommentUserIds: mergedAccessUserIds,
        canManageMeetingUserIds,
        canEditUserIds,
        canCreateEstimateUserIds,
      }));
      setComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    }
  };

  const handleMeetingCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = meetingComment.trim();
    if (!trimmed || !selectedMeetingId || !actorId) return;

    setSavingMeetingComment(true);
    try {
      await addComment(trimmed, undefined, selectedMeetingId);

      const recipientIds = getRelatedRecipientIds(latestRecordData, actorId);
      for (const recipientId of recipientIds) {
        await createNotification({
          recipientId,
          type: "comment",
          recordId: record.id,
          meetingUpdateId: selectedMeetingId,
          message: `${actorName} commented on a meeting update for Project ${record.projectName}: "${trimmed.substring(0, 50)}${trimmed.length > 50 ? "..." : ""}"`,
          createdById: actorId,
          createdByName: actorName,
        });
      }

      setMeetingComment("");
      toast({
        title: "Meeting comment added",
        description: "The comment has been posted for this meeting update.",
      });
    } catch (error) {
      console.error("Error adding meeting comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment on this meeting update.",
        variant: "destructive",
      });
    } finally {
      setSavingMeetingComment(false);
    }
  };

  const handleReimbursementAction = async (
    decision: "approved" | "rejected",
  ) => {
    if (!selectedMeeting || !isAdminLike || !actorId) return;

    const trimmedApprovalRemark = approvalRemark.trim();
    const trimmedRejectionReason = rejectionReason.trim();

    if (decision === "rejected" && !trimmedRejectionReason) {
      toast({
        title: "Rejection reason required",
        description:
          "Please enter the rejection reason before rejecting this reimbursement.",
        variant: "destructive",
      });
      return;
    }

    setActioningReimbursement(decision);
    try {
      await updateDoc(
        doc(db, `salesRecords/${record.id}/meetingUpdates`, selectedMeeting.id),
        {
          "reimbursement.approvalStatus": decision,
          "reimbursement.claimStatus": decision,
          "reimbursement.approvalRemark": trimmedApprovalRemark || null,
          "reimbursement.rejectionReason":
            decision === "rejected" ? trimmedRejectionReason : null,
          "reimbursement.approvalActionAt": serverTimestamp(),
          "reimbursement.approvalActionById": actorId,
          "reimbursement.approvalActionByName": actorName,
          updatedAt: serverTimestamp(),
        },
      );

      const recipients = getRelatedRecipientIds(latestRecordData, actorId);
      for (const recipientId of recipients) {
        await createNotification({
          recipientId,
          type: "meeting_update",
          recordId: record.id,
          meetingUpdateId: selectedMeeting.id,
          message:
            decision === "approved"
              ? `${actorName} approved the reimbursement claim for Project ${record.projectName}.`
              : `${actorName} rejected the reimbursement claim for Project ${record.projectName}.`,
          createdById: actorId,
          createdByName: actorName,
        });
      }

      toast({
        title:
          decision === "approved"
            ? "Reimbursement approved"
            : "Reimbursement rejected",
        description: `The reimbursement claim has been ${decision}.`,
      });
    } catch (error) {
      console.error("Error updating reimbursement:", error);
      toast({
        title: "Action failed",
        description: "Unable to update the reimbursement approval status.",
        variant: "destructive",
      });
    } finally {
      setActioningReimbursement(null);
    }
  };

  const recordUpdatedAt = toJsDate(
    extraRecordData.updatedAt ?? (record as any).updatedAt,
  );
  const recordGoal = extraRecordData.goal ?? (record as any).goal ?? "N/A";
  const recordCreatedAt = toJsDate(
    extraRecordData.createdAt ?? (record as any).createdAt,
  );
  const recordComments =
    extraRecordData.comments ?? (record as any).comments ?? [];
  const nextFollowUpDate = toJsDate(
    extraRecordData.nextFollowUp?.date || (record as any)?.nextFollowUp?.date,
  );
  const selectedMeetingDate = toJsDate(
    (selectedMeeting as any)?.meetingDate || (selectedMeeting as any)?.date,
  );
  const reimbursement = (selectedMeeting as any)?.reimbursement;
  const reimbursementStatus = String(
    reimbursement?.approvalStatus ||
      reimbursement?.status ||
      reimbursement?.claimStatus ||
      "pending",
  ).toLowerCase();
  const reimbursementApprovedAt = toJsDate(
    reimbursement?.approvalActionAt || reimbursement?.approvedAt,
  );
  const reimbursementApprovedBy =
    reimbursement?.approvalActionByName ||
    reimbursement?.approvedByName ||
    reimbursement?.approvalActionById ||
    reimbursement?.approvedById ||
    "";
  const linkedEstimates = linkedCommercialItems.filter(
    (item) => item.source === "estimates",
  );
  const linkedInvoices = linkedCommercialItems.filter(
    (item) => item.source === "estimateInvoices",
  );
  const canAdminActionReimbursement =
    isAdminLike &&
    Boolean(reimbursement?.enabled) &&
    !["approved", "rejected"].includes(reimbursementStatus);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[112rem] w-[99vw] max-h-[96vh] overflow-y-auto rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-black">
            <i className="fas fa-briefcase" />
            <span>Project Details</span>
            {isAdminLike && <Badge className="ml-2">Admin View</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-[0.82fr_1.18fr] gap-4">
          <div className="space-y-6">
            <div className="grid grid-cols-1 2xl:grid-cols-[0.72fr_1.28fr] gap-4 items-start">
              <div className="bg-gray-50 p-3 rounded-xl shadow-sm border">
                <h3 className="text-sm font-semibold mb-2.5 text-gray-800">
                  People
                </h3>
                <div className="space-y-2.5 text-sm text-gray-700">
                  <div className="rounded-lg border bg-white p-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900 mb-1.5">
                      <User className="h-4 w-4" /> Supervisors
                    </div>
                    <p>{displayUserList(extraRecordData.supervisors)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900 mb-1.5">
                      <ShieldCheck className="h-4 w-4" /> Project Custodians
                    </div>
                    <p>{displayUserList(extraRecordData.projectCustodians)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900 mb-1.5">
                      <Phone className="h-4 w-4" /> Assigned Admin
                    </div>
                    <p>
                      {extraRecordData.assignedAdminName ||
                        (extraRecordData.assignedAdminId
                          ? userDirectory[extraRecordData.assignedAdminId] ||
                            extraRecordData.assignedAdminId
                          : "N/A")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl shadow-sm border">
                <h3 className="text-base font-semibold mb-3 text-gray-800">
                  Basic Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Project Code:</span>{" "}
                    {effectiveProjectCode || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Sales Person:</span>{" "}
                    {record.salesPersonName || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Client:</span>{" "}
                    {record.client || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Project:</span>{" "}
                    {record.projectName || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Projected Value:</span>{" "}
                    {formatCurrency((record as any).projectedValue)}
                  </p>
                  <p>
                    <span className="font-medium">Won Value:</span>{" "}
                    {formatCurrency(
                      extraRecordData.wonValue ?? (record as any).wonValue,
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {record.projectStatus || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Need Help:</span>{" "}
                    {(extraRecordData.needHelp ?? (record as any).needHelp)
                      ? "Yes"
                      : "No"}
                  </p>
                  <p>
                    <span className="font-medium">Estimate #:</span>{" "}
                    {extraRecordData.estimateNumber ||
                      (record as any).estimateNumber ||
                      "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Invoice #:</span>{" "}
                    {extraRecordData.invoiceNumber ||
                      (record as any).invoiceNumber ||
                      "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Payment Ref:</span>{" "}
                    {extraRecordData.paymentRef ||
                      (record as any).paymentRef ||
                      "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Started:</span>{" "}
                    {recordCreatedAt
                      ? formatDistanceToNow(recordCreatedAt, {
                          addSuffix: true,
                        })
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {recordUpdatedAt
                      ? `${recordUpdatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} ${recordUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Contact Person:</span>{" "}
                    {extraRecordData.contactPerson ||
                      (record as any).contactPerson ||
                      "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Contact Mobile:</span>{" "}
                    {extraRecordData.contactMobile ||
                      (record as any).contactMobile ||
                      "N/A"}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-bold">Description:</span> {recordGoal}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl shadow-sm border">
              <h3 className="text-base font-semibold mb-3 text-gray-800">
                Project Comments
              </h3>
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <Label htmlFor="comment" className="text-sm font-medium">
                  Add a Comment
                </Label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="border rounded-lg w-full p-2 min-h-[100px]"
                  required
                />
                <Button
                  type="submit"
                  className="bg-black hover:bg-slate-950 text-white"
                >
                  Submit Comment
                </Button>
              </form>

              <div className="space-y-3 mt-4 max-h-[24rem] overflow-y-auto pr-1">
                {recordComments.length ? (
                  recordComments.map((c: any, index: number) => {
                    const ts = toJsDate(c.timestamp);
                    return (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-white shadow-sm"
                      >
                        <p className="text-sm">
                          <strong>{c.userName}</strong>: {c.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ts ? ts.toLocaleString("en-GB") : "Pending..."}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No comments yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl shadow-sm border">
              <h3 className="text-base font-semibold mb-3 text-gray-800 flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Meeting Updates
              </h3>

              {meetingUpdatesLoading ? (
                <p className="text-sm text-gray-500">
                  Loading meeting updates...
                </p>
              ) : meetingUpdates.length > 0 ? (
                <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-3">
                  <div className="space-y-2 max-h-[34rem] overflow-y-auto pr-1">
                    {meetingUpdates.map((meeting) => {
                      const meetingDate = toJsDate(
                        (meeting as any).meetingDate || (meeting as any).date,
                      );
                      const meetingMode = (meeting as any).online
                        ? "Online"
                        : meeting.visit
                          ? "Visit"
                          : "N/A";
                      const hasReimbursement = Boolean(
                        (meeting as any).reimbursement?.enabled,
                      );

                      return (
                        <div
                          key={meeting.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedMeetingId === meeting.id
                              ? "bg-blue-50 border-blue-200"
                              : "bg-white hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedMeetingId(meeting.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {meeting.visit ? (
                                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400 shrink-0" />
                              )}
                              <span className="text-sm font-medium truncate">
                                {meetingDate
                                  ? meetingDate.toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Unknown date"}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              {meetingMode}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {meeting.actionItems?.length ?? 0} actions
                            </Badge>
                            {hasReimbursement && (
                              <Badge className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">
                                Reimbursement
                              </Badge>
                            )}
                          </div>
                          {meeting.discussionNotes && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                              {meeting.discussionNotes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedMeeting && (
                    <div className="space-y-3 border rounded-xl bg-white p-3.5">
                      <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                        <p>
                          <span className="font-medium">Meeting Date:</span>{" "}
                          {selectedMeetingDate
                            ? selectedMeetingDate.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Mode:</span>{" "}
                          {(selectedMeeting as any).online
                            ? "Online"
                            : selectedMeeting.visit
                              ? "Visit"
                              : "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Created By:</span>{" "}
                          {selectedMeeting.createdByName || "N/A"}
                        </p>
                        <p>
                          <span className="font-medium">Last Updated:</span>{" "}
                          {toJsDate((selectedMeeting as any).updatedAt)
                            ? formatDistanceToNow(
                                toJsDate(
                                  (selectedMeeting as any).updatedAt,
                                ) as Date,
                                { addSuffix: true },
                              )
                            : "N/A"}
                        </p>
                      </div>

                      <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2 font-medium text-gray-900 mb-2">
                          <ClipboardList className="h-4 w-4" /> Next Follow-Up
                        </div>
                        <p>
                          {nextFollowUpDate
                            ? nextFollowUpDate.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                        {!!extraRecordData.nextFollowUp?.actionItems
                          ?.length && (
                          <ul className="list-disc ml-5 mt-2 space-y-1">
                            {extraRecordData.nextFollowUp.actionItems.map(
                              (item, index) => (
                                <li key={index}>{item}</li>
                              ),
                            )}
                          </ul>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-900">
                          Discussion Notes
                        </Label>
                        <div className="mt-1 rounded-lg border bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap min-h-[72px]">
                          {(selectedMeeting as any).discussionNotes ||
                            "No discussion notes added."}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-900">
                          Action Items
                        </Label>
                        {selectedMeeting.actionItems?.length ? (
                          <ul className="mt-2 list-disc ml-5 space-y-1 text-sm text-gray-700">
                            {selectedMeeting.actionItems.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-gray-500 italic">
                            No action items for this meeting.
                          </p>
                        )}
                      </div>

                      {reimbursement?.enabled && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 font-medium text-amber-900">
                              <Receipt className="h-4 w-4" /> Reimbursement
                              Claim
                            </div>
                            <Badge
                              className={
                                reimbursementStatus === "approved"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : reimbursementStatus === "rejected"
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              }
                            >
                              {reimbursementStatus.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                            <p>
                              <span className="font-medium">Amount:</span>{" "}
                              {reimbursement.amount || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Submitted By:</span>{" "}
                              {reimbursement.approvalSubmittedByName ||
                                selectedMeeting.createdByName ||
                                "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Submitted At:</span>{" "}
                              {toJsDate(reimbursement.approvalSubmittedAt)
                                ? toJsDate(
                                    reimbursement.approvalSubmittedAt,
                                  )?.toLocaleString("en-GB")
                                : "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Fuel Claim:</span>{" "}
                              {reimbursement.fuelClaimEnabled
                                ? `${reimbursement.fuelType || "Vehicle"} - ${reimbursement.kms || "0"} KM`
                                : "No"}
                            </p>
                            <p className="sm:col-span-2">
                              <span className="font-medium">Detail:</span>{" "}
                              {reimbursement.detail || "N/A"}
                            </p>
                            <p className="sm:col-span-2">
                              <span className="font-medium">Bill:</span>{" "}
                              {reimbursement.billUrl ? (
                                <a
                                  href={reimbursement.billUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  {reimbursement.billFileName || "Open bill"}
                                </a>
                              ) : (
                                reimbursement.billFileName || "Not attached"
                              )}
                            </p>
                            <p className="sm:col-span-2">
                              <span className="font-medium">
                                Approval Remark:
                              </span>{" "}
                              {reimbursement.approvalRemark ||
                                reimbursement.adminRemark ||
                                "N/A"}
                            </p>
                            <p className="sm:col-span-2">
                              <span className="font-medium">
                                Rejection Reason:
                              </span>{" "}
                              {reimbursement.rejectionReason || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Approved By:</span>{" "}
                              {reimbursementApprovedBy || "N/A"}
                            </p>
                            <p>
                              <span className="font-medium">Approved At:</span>{" "}
                              {reimbursementApprovedAt
                                ? reimbursementApprovedAt.toLocaleString(
                                    "en-GB",
                                  )
                                : "N/A"}
                            </p>
                          </div>

                          <div className="text-xs text-amber-800">
                            {reimbursement.claimRuleText ||
                              "Claim reimbursements on the day of meeting otherwise the claim cannot be submitted later."}
                          </div>

                          {isAdminLike && (
                            <div className="rounded-lg border bg-white p-3 space-y-3">
                              <div className="text-sm font-semibold text-gray-900">
                                Admin Approval
                              </div>

                              {canAdminActionReimbursement && (
                                <>
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor="approval-remark"
                                      className="text-sm font-medium text-gray-700"
                                    >
                                      Approval Remarks
                                    </Label>
                                    <textarea
                                      id="approval-remark"
                                      value={approvalRemark}
                                      onChange={(e) =>
                                        setApprovalRemark(e.target.value)
                                      }
                                      className="border rounded-lg w-full p-2 min-h-[80px]"
                                      placeholder="Add internal approval remarks or notes for the submitter"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <Label
                                      htmlFor="rejection-reason"
                                      className="text-sm font-medium text-gray-700"
                                    >
                                      Rejection Reason
                                    </Label>
                                    <textarea
                                      id="rejection-reason"
                                      value={rejectionReason}
                                      onChange={(e) =>
                                        setRejectionReason(e.target.value)
                                      }
                                      className="border rounded-lg w-full p-2 min-h-[80px]"
                                      placeholder="If rejecting, provide the reason here"
                                    />
                                  </div>

                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <Button
                                      type="button"
                                      onClick={() =>
                                        handleReimbursementAction("approved")
                                      }
                                      disabled={!!actioningReimbursement}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {actioningReimbursement === "approved"
                                        ? "Approving..."
                                        : "Approve Claim"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      onClick={() =>
                                        handleReimbursementAction("rejected")
                                      }
                                      disabled={!!actioningReimbursement}
                                    >
                                      {actioningReimbursement === "rejected"
                                        ? "Rejecting..."
                                        : "Reject Claim"}
                                    </Button>
                                  </div>
                                </>
                              )}

                              {!canAdminActionReimbursement && (
                                <div className="text-sm text-gray-600">
                                  {reimbursementStatus === "approved"
                                    ? "This reimbursement has already been approved."
                                    : reimbursementStatus === "rejected"
                                      ? "This reimbursement has already been rejected."
                                      : "No reimbursement action is pending for this meeting."}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Comments for this meeting
                        </Label>

                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto rounded-lg border bg-gray-50 p-3">
                          {commentsLoading ? (
                            <p className="text-sm text-gray-500">
                              Loading comments...
                            </p>
                          ) : comments.length > 0 ? (
                            comments.map((c) => {
                              const createdAt = toJsDate((c as any).createdAt);
                              return (
                                <div
                                  key={c.id}
                                  className="bg-white p-3 rounded border text-sm"
                                >
                                  <p className="text-gray-900">{c.text}</p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                                    <span>{c.authorName}</span>
                                    <span>•</span>
                                    <span>
                                      {createdAt
                                        ? formatDistanceToNow(createdAt, {
                                            addSuffix: true,
                                          })
                                        : "Unknown time"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No comments for this meeting yet.
                            </p>
                          )}
                        </div>

                        <form
                          onSubmit={handleMeetingCommentSubmit}
                          className="mt-3 space-y-2"
                        >
                          <Label
                            htmlFor="meeting-comment"
                            className="text-sm font-medium"
                          >
                            Add Meeting Comment
                          </Label>
                          <textarea
                            id="meeting-comment"
                            value={meetingComment}
                            onChange={(e) => setMeetingComment(e.target.value)}
                            className="border rounded-lg w-full p-2 min-h-[84px]"
                            placeholder="Add a note or admin instruction for this meeting update"
                            required
                          />
                          <Button
                            type="submit"
                            disabled={
                              savingMeetingComment || !selectedMeetingId
                            }
                          >
                            {savingMeetingComment
                              ? "Saving..."
                              : "Submit Meeting Comment"}
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Circle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No meeting updates created yet
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl shadow-sm border">
              <h3 className="text-base font-semibold mb-3 text-gray-800">
                Commercial Snapshot
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="rounded-lg border bg-white p-4">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <BadgeDollarSign className="h-4 w-4" /> Overview
                  </div>
                  <p className="mt-2">
                    <span className="font-medium">Projected:</span>{" "}
                    {formatCurrency((record as any).projectedValue)}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Won:</span>{" "}
                    {formatCurrency(
                      extraRecordData.wonValue ?? (record as any).wonValue,
                    )}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Estimate #:</span>{" "}
                    {extraRecordData.estimateNumber ||
                      (record as any).estimateNumber ||
                      "N/A"}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Invoice #:</span>{" "}
                    {extraRecordData.invoiceNumber ||
                      (record as any).invoiceNumber ||
                      "N/A"}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Payment Ref:</span>{" "}
                    {extraRecordData.paymentRef ||
                      (record as any).paymentRef ||
                      "N/A"}
                  </p>
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <FileText className="h-4 w-4" /> Estimates for this Project
                    Code
                  </div>
                  {commercialLoading ? (
                    <p className="mt-2 text-sm text-gray-500">
                      Loading estimates...
                    </p>
                  ) : linkedEstimates.length ? (
                    <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                      {linkedEstimates.map((item) => {
                        const createdAt = toJsDate(item.createdAt);
                        return (
                          <div
                            key={`${item.source}-${item.id}`}
                            className="rounded-lg border p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-gray-900">
                                {item.number}
                              </span>
                              <Badge variant="outline">
                                {item.status || "Saved"}
                              </Badge>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              Amount:{" "}
                              {item.amount
                                ? formatCurrency(item.amount)
                                : "N/A"}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {item.createdByName
                                ? `Created by ${item.createdByName}`
                                : "Creator unavailable"}
                              {createdAt
                                ? ` • ${createdAt.toLocaleDateString("en-GB")}`
                                : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      No estimates found for this project code.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-white p-4">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <Receipt className="h-4 w-4" /> Invoices for this Project
                    Code
                  </div>
                  {commercialLoading ? (
                    <p className="mt-2 text-sm text-gray-500">
                      Loading invoices...
                    </p>
                  ) : linkedInvoices.length ? (
                    <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                      {linkedInvoices.map((item) => {
                        const createdAt = toJsDate(item.createdAt);
                        return (
                          <div
                            key={`${item.source}-${item.id}`}
                            className="rounded-lg border p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-gray-900">
                                {item.number}
                              </span>
                              <Badge variant="outline">
                                {item.status || "Saved"}
                              </Badge>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              Amount:{" "}
                              {item.amount
                                ? formatCurrency(item.amount)
                                : "N/A"}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {item.createdByName
                                ? `Created by ${item.createdByName}`
                                : "Creator unavailable"}
                              {createdAt
                                ? ` • ${createdAt.toLocaleDateString("en-GB")}`
                                : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      No invoices found for this project code.
                    </p>
                  )}
                </div>

                {(extraRecordData.needHelp ?? (record as any).needHelp) && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4" /> Support Required
                    </div>
                    <p className="mt-2 text-sm">
                      This project is marked as needing help. Please review the
                      latest comments and follow-up items.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-lg border-gray-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
