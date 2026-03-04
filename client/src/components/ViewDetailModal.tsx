import React, { useState } from "react";
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
import { CalendarDays, MessageSquare, CheckCircle, Circle } from "lucide-react";
import {
  serverTimestamp,
  updateDoc,
  doc,
  Timestamp, // ✅ add this
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { useMeetingUpdates } from "@/hooks/useMeetingUpdates";
import { useMeetingUpdateComments } from "@/hooks/useMeetingUpdateComments";
import type { SalesRecord } from "@shared/schema";

interface ViewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: SalesRecord;
}

// ✅ Safe converter for Firestore Timestamp / string / number / Date
function toJsDate(value: any): Date | null {
  if (!value) return null;

  // Already a JS Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Firestore Timestamp instance
  if (value instanceof Timestamp) {
    const d = value.toDate();
    return isNaN(d.getTime()) ? null : d;
  }

  // Firestore Timestamp-like (has toDate)
  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }

  // Timestamp-like plain object { seconds, nanoseconds }
  if (typeof value?.seconds === "number") {
    const d = new Date(value.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO string or millis
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function ViewDetailModal({
  isOpen,
  onClose,
  record,
}: ViewDetailModalProps) {
  const { userProfile } = useAuth();
  const [comment, setComment] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );

  const { meetingUpdates, loading: meetingUpdatesLoading } = useMeetingUpdates(
    record.id,
  );

  const selectedMeeting = meetingUpdates.find(
    (meeting) => meeting.id === selectedMeetingId,
  );

  const { comments, loading: commentsLoading } = useMeetingUpdateComments(
    record.id,
    selectedMeetingId || undefined,
  );

  React.useEffect(() => {
    if (meetingUpdates.length > 0 && !selectedMeetingId) {
      setSelectedMeetingId(meetingUpdates[0].id);
    }
  }, [meetingUpdates, selectedMeetingId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date();
    const userName = userProfile?.displayName || "Unknown User";

    const newComment = { text: comment, timestamp, userName };

    try {
      const recordDoc = doc(
        db,
        "Panels",
        "IEDGE-SYSTEM",
        "salesRecords",
        record.id,
      );

      await updateDoc(recordDoc, {
        comments: [...(record.comments || []), newComment],
        updatedAt: serverTimestamp(),
      });

      setComment("");
      onClose();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // ✅ Safe record updatedAt formatting
  const recordUpdatedAt = toJsDate((record as any).updatedAt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-black">
            <i className="fas fa-briefcase" />
            <span>Project Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Basic Info */}
          <div className="bg-gray-50 p-5 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Sales Person:</span>{" "}
                {record.salesPersonName}
              </p>
              <p>
                <span className="font-medium">Client:</span> {record.client}
              </p>
              <p>
                <span className="font-medium">Project:</span>{" "}
                {record.projectName}
              </p>
              <p>
                <span className="font-medium">Projected Value:</span> Rs{" "}
                {record.projectedValue.toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {record.projectStatus}
              </p>
              <p>
                <span className="font-medium">Last Updated:</span>{" "}
                {recordUpdatedAt
                  ? `${recordUpdatedAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })} ${recordUpdatedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Meeting Updates Section */}
          <div className="bg-gray-50 p-5 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Meeting Updates
            </h3>

            {meetingUpdatesLoading ? (
              <p className="text-sm text-gray-500">
                Loading meeting updates...
              </p>
            ) : meetingUpdates.length > 0 ? (
              <div className="space-y-4">
                {/* Meeting List */}
                <div className="space-y-2">
                  {meetingUpdates.map((meeting) => {
                    const meetingDate = toJsDate((meeting as any).meetingDate);

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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {meeting.visit ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium">
                              Meeting on{" "}
                              {meetingDate
                                ? meetingDate.toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Unknown date"}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {meeting.actionItems?.length ?? 0} actions
                          </Badge>
                        </div>

                        {meeting.discussionNotes && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {meeting.discussionNotes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Meeting Details */}
                {selectedMeeting && (
                  <div className="border-t pt-4 space-y-4">
                    {/* Meeting Comments */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Comments for this meeting
                      </Label>

                      <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
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
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
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
                    </div>

                    {/* Meeting Metadata */}
                    <div className="text-xs text-gray-500 border-t pt-2">
                      <p>Created by: {selectedMeeting.createdByName}</p>

                      {/* If selectedMeeting.date is also timestamp-like, format it safely */}
                      <p>
                        Date:{" "}
                        {(() => {
                          const d = toJsDate((selectedMeeting as any).date);
                          return d
                            ? d.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : String((selectedMeeting as any).date ?? "N/A");
                        })()}
                      </p>

                      <p>
                        Last updated:{" "}
                        {(() => {
                          const d = toJsDate(
                            (selectedMeeting as any).updatedAt,
                          );
                          return d
                            ? formatDistanceToNow(d, { addSuffix: true })
                            : "N/A";
                        })()}
                      </p>
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

          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Comments
            </h3>

            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <Label htmlFor="comment" className="text-sm font-medium">
                Add a Comment
              </Label>
              <input
                type="text"
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="border rounded-lg w-full p-2"
                required
              />
              <button
                type="submit"
                className="bg-black hover:bg-slate-950 text-white px-4 py-2 rounded-lg"
              >
                Submit
              </button>
            </form>

            <div className="space-y-3 mt-4">
              {record.comments?.length ? (
                record.comments.map((c: any, index: number) => {
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
                <p className="text-sm text-gray-500 italic">No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
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
