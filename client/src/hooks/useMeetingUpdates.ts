import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MeetingUpdate, normalizeMeetingUpdate, InsertMeetingUpdate } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/hooks/useNotifications';

export function useMeetingUpdates(recordId?: string) {
  const { userProfile } = useAuth();
  const [meetingUpdates, setMeetingUpdates] = useState<MeetingUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId) {
      setMeetingUpdates([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `salesRecords/${recordId}/meetingUpdates`),
      orderBy('meetingDate', 'desc') // Most recent meetings first
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetingUpdateList: MeetingUpdate[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        meetingUpdateList.push(normalizeMeetingUpdate({
          id: doc.id,
          ...data
        }));
      });
      
      setMeetingUpdates(meetingUpdateList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching meeting updates:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [recordId]);

  const createMeetingUpdate = async (meetingUpdateData: InsertMeetingUpdate, recipientId?: string) => {
    if (!recordId || !userProfile) return null;

    try {
      const meetingUpdateDoc = await addDoc(collection(db, `salesRecords/${recordId}/meetingUpdates`), {
        ...meetingUpdateData,
        createdById: userProfile.id,
        createdByName: userProfile.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create notification for the other party (admin <-> sales person)
      if (recipientId && recipientId !== userProfile.id) {
        await createNotification({
          recipientId,
          type: 'meeting_update',
          recordId,
          meetingUpdateId: meetingUpdateDoc.id,
          message: `${userProfile.displayName} created a new meeting update for ${meetingUpdateData.meetingDate}`,
          createdById: userProfile.id,
          createdByName: userProfile.displayName
        });
      }

      return meetingUpdateDoc.id;
    } catch (error) {
      console.error('Error creating meeting update:', error);
      throw error;
    }
  };

  const updateMeetingUpdate = async (meetingUpdateId: string, updates: Partial<MeetingUpdate>, recipientId?: string) => {
    if (!recordId || !userProfile) return;

    try {
      await updateDoc(doc(db, `salesRecords/${recordId}/meetingUpdates`, meetingUpdateId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Create notification for the other party (admin <-> sales person)
      if (recipientId && recipientId !== userProfile.id) {
        await createNotification({
          recipientId,
          type: 'meeting_update',
          recordId,
          meetingUpdateId,
          message: `${userProfile.displayName} updated a meeting record`,
          createdById: userProfile.id,
          createdByName: userProfile.displayName
        });
      }
    } catch (error) {
      console.error('Error updating meeting update:', error);
      throw error;
    }
  };

  const deleteMeetingUpdate = async (meetingUpdateId: string) => {
    if (!recordId) return;

    try {
      await deleteDoc(doc(db, `salesRecords/${recordId}/meetingUpdates`, meetingUpdateId));
    } catch (error) {
      console.error('Error deleting meeting update:', error);
      throw error;
    }
  };

  const getMeetingUpdateById = (meetingUpdateId: string): MeetingUpdate | undefined => {
    return meetingUpdates.find(update => update.id === meetingUpdateId);
  };

  return {
    meetingUpdates,
    loading,
    createMeetingUpdate,
    updateMeetingUpdate,
    deleteMeetingUpdate,
    getMeetingUpdateById
  };
}