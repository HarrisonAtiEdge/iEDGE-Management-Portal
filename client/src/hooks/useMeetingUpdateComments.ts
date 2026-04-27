// import { useState, useEffect } from "react";
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   addDoc,
//   doc,
//   getDoc,
//   updateDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import {
//   MeetingUpdateComment,
//   normalizeMeetingUpdateComment,
//   InsertMeetingUpdateComment,
// } from "@shared/schema";
// import { useAuth } from "@/contexts/AuthContext";
// import { createNotification } from "@/hooks/useNotifications";

// export function useMeetingUpdateComments(
//   recordId?: string,
//   meetingUpdateId?: string,
// ) {
//   const { userProfile, currentUser } = useAuth();
//   const actorId = currentUser?.uid || userProfile?.id || "";
//   const [comments, setComments] = useState<MeetingUpdateComment[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!recordId || !meetingUpdateId) {
//       setComments([]);
//       setLoading(false);
//       return;
//     }

//     const q = query(
//       collection(
//         db,
//         "Panels",
//         "IEDGE-SYSTEM",
//         "salesRecords",
//         recordId,
//         "meetingUpdates",
//         meetingUpdateId,
//         "comments",
//       ),
//       orderBy("createdAt", "asc"),
//     );

//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const commentList: MeetingUpdateComment[] = [];
//         snapshot.forEach((docSnap) => {
//           const data = docSnap.data();
//           commentList.push(
//             normalizeMeetingUpdateComment({
//               id: docSnap.id,
//               ...data,
//             }),
//           );
//         });

//         setComments(commentList);
//         setLoading(false);
//       },
//       (error) => {
//         console.error("Error fetching meeting update comments:", error);
//         setLoading(false);
//       },
//     );

//     return () => unsubscribe();
//   }, [recordId, meetingUpdateId]);

//   const addComment = async (
//     text: string,
//     _recipientId?: string,
//     explicitMeetingUpdateId?: string,
//     projectName?: string,
//   ) => {
//     const targetMeetingUpdateId = explicitMeetingUpdateId || meetingUpdateId;

//     if (!recordId || !targetMeetingUpdateId || !userProfile || !text.trim()) {
//       return null;
//     }

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

//       const commentData: InsertMeetingUpdateComment = {
//         meetingUpdateId: targetMeetingUpdateId,
//         text: text.trim(),
//         authorId: actorId,
//         authorName: userProfile.displayName,
//         authorRole: userProfile.role,
//       };

//       const commentDoc = await addDoc(
//         collection(
//           db,
//           "Panels",
//           "IEDGE-SYSTEM",
//           "salesRecords",
//           recordId,
//           "meetingUpdates",
//           targetMeetingUpdateId,
//           "comments",
//         ),
//         {
//           ...commentData,
//           createdAt: serverTimestamp(),
//         },
//       );

//       const existingAdminParticipantIds = Array.isArray(
//         latestRecord.adminParticipantIds,
//       )
//         ? latestRecord.adminParticipantIds
//         : [];

//       if (userProfile.role !== "sales") {
//         await updateDoc(recordDoc, {
//           assignedAdminId: actorId,
//           assignedAdminName: userProfile.displayName,
//           adminParticipantIds: Array.from(
//             new Set([...existingAdminParticipantIds, actorId]),
//           ),
//           updatedAt: serverTimestamp(),
//         });

//         const salesRecipientId =
//           latestRecord.salesPersonId && latestRecord.salesPersonId !== actorId
//             ? latestRecord.salesPersonId
//             : undefined;

//         if (salesRecipientId) {
//           await createNotification({
//             recipientId: salesRecipientId,
//             type: "comment",
//             recordId,
//             meetingUpdateId: targetMeetingUpdateId,
//             message: `${userProfile.displayName} commented on Project ${projectName || latestRecord.projectName || "Untitled"}: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
//             createdById: actorId,
//             createdByName: userProfile.displayName,
//           });
//         }
//       } else {
//         const adminRecipientIds =
//           existingAdminParticipantIds.length > 0
//             ? Array.from(
//                 new Set(
//                   existingAdminParticipantIds.filter(
//                     (id: string) => id && id !== actorId,
//                   ),
//                 ),
//               )
//             : latestRecord.assignedAdminId &&
//                 latestRecord.assignedAdminId !== actorId
//               ? [latestRecord.assignedAdminId]
//               : [];

//         for (const recipientId of adminRecipientIds) {
//           await createNotification({
//             recipientId,
//             type: "comment",
//             recordId,
//             meetingUpdateId: targetMeetingUpdateId,
//             message: `${userProfile.displayName} commented on Project ${projectName || latestRecord.projectName || "Untitled"}: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
//             createdById: actorId,
//             createdByName: userProfile.displayName,
//           });
//         }
//       }

//       return commentDoc.id;
//     } catch (error) {
//       console.error("Error adding comment:", error);
//       throw error;
//     }
//   };

//   return {
//     comments,
//     loading,
//     addComment,
//   };
// }

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  MeetingUpdateComment,
  normalizeMeetingUpdateComment,
  InsertMeetingUpdateComment,
} from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";

type RecipientInput = string | string[] | undefined;

function normalizeRecipientIds(recipientIds: RecipientInput, actorId: string) {
  const values = Array.isArray(recipientIds)
    ? recipientIds
    : recipientIds
      ? [recipientIds]
      : [];
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter((value) => !!value && value !== actorId),
    ),
  );
}

export function useMeetingUpdateComments(
  recordId?: string,
  meetingUpdateId?: string,
) {
  const { userProfile, currentUser } = useAuth();
  const actorId = currentUser?.uid || userProfile?.id || "";
  const [comments, setComments] = useState<MeetingUpdateComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId || !meetingUpdateId) {
      setComments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(
        db,
        `salesRecords/${recordId}/meetingUpdates/${meetingUpdateId}/comments`,
      ),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentList: MeetingUpdateComment[] = [];
        snapshot.forEach((commentDoc) => {
          const data = commentDoc.data();
          commentList.push(
            normalizeMeetingUpdateComment({
              id: commentDoc.id,
              ...data,
            }),
          );
        });

        setComments(commentList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching meeting update comments:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [recordId, meetingUpdateId]);

  const addComment = async (
    text: string,
    recipientIds?: RecipientInput,
    explicitMeetingUpdateId?: string,
  ) => {
    const targetMeetingUpdateId = explicitMeetingUpdateId || meetingUpdateId;
    if (
      !recordId ||
      !targetMeetingUpdateId ||
      !userProfile ||
      !actorId ||
      !text.trim()
    )
      return null;

    try {
      const commentData: InsertMeetingUpdateComment = {
        meetingUpdateId: targetMeetingUpdateId,
        text: text.trim(),
        authorId: actorId,
        authorName: userProfile.displayName,
        authorRole: userProfile.role,
      };

      const commentDoc = await addDoc(
        collection(
          db,
          `Panels/IEDGE-SYSTEM/salesRecords/${recordId}/meetingUpdates/${targetMeetingUpdateId}/comments`,
        ),
        {
          ...commentData,
          createdAt: serverTimestamp(),
        },
      );

      const normalizedRecipients = normalizeRecipientIds(recipientIds, actorId);
      const preview = text.trim();
      const message = `${userProfile.displayName} commented on meeting update: "${preview.substring(0, 50)}${preview.length > 50 ? "..." : ""}"`;

      for (const recipientId of normalizedRecipients) {
        await createNotification({
          recipientId,
          type: "comment",
          recordId,
          meetingUpdateId: targetMeetingUpdateId,
          message,
          createdById: actorId,
          createdByName: userProfile.displayName,
        });
      }

      return commentDoc.id;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  return {
    comments,
    loading,
    addComment,
  };
}
