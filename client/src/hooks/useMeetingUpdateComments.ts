import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MeetingUpdateComment, normalizeMeetingUpdateComment, InsertMeetingUpdateComment } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/hooks/useNotifications';

export function useMeetingUpdateComments(recordId?: string, meetingUpdateId?: string) {
  const { userProfile } = useAuth();
  const [comments, setComments] = useState<MeetingUpdateComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId || !meetingUpdateId) {
      setComments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `salesRecords/${recordId}/meetingUpdates/${meetingUpdateId}/comments`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentList: MeetingUpdateComment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        commentList.push(normalizeMeetingUpdateComment({
          id: doc.id,
          ...data
        }));
      });
      
      setComments(commentList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching meeting update comments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recordId, meetingUpdateId]);

  const addComment = async (text: string, recipientId?: string, explicitMeetingUpdateId?: string) => {
    const targetMeetingUpdateId = explicitMeetingUpdateId || meetingUpdateId;
    if (!recordId || !targetMeetingUpdateId || !userProfile || !text.trim()) return null;

    try {
      const commentData: InsertMeetingUpdateComment = {
        meetingUpdateId: targetMeetingUpdateId,
        text: text.trim(),
        authorId: userProfile.id,
        authorName: userProfile.displayName,
        authorRole: userProfile.role
      };

      const commentDoc = await addDoc(
        collection(db, `salesRecords/${recordId}/meetingUpdates/${targetMeetingUpdateId}/comments`),
        {
          ...commentData,
          createdAt: serverTimestamp()
        }
      );

      // Create notification for the other party (admin <-> sales person)
      if (recipientId && recipientId !== userProfile.id) {
        const message = `${userProfile.displayName} commented on meeting update: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`;
        
        await createNotification({
          recipientId,
          type: 'comment',
          recordId,
          meetingUpdateId: targetMeetingUpdateId,
          message,
          createdById: userProfile.id,
          createdByName: userProfile.displayName
        });
      }

      return commentDoc.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  return {
    comments,
    loading,
    addComment
  };
}