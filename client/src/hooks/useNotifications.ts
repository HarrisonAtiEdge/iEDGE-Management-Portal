import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Notification,
  normalizeNotification,
  NotificationType,
} from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationList: Notification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // 🔹 Convert Firestore Timestamp → JS Date
          const createdAt =
            data.createdAt?.toDate?.() instanceof Date
              ? data.createdAt.toDate()
              : new Date();

          notificationList.push(
            normalizeNotification({
              id: docSnap.id,
              ...data,
              createdAt,
            }),
          );
        });

        setNotifications(notificationList);
        setUnreadCount(notificationList.filter((n) => !n.read).length);
        setLoading(false);
      },
      (error: FirestoreError) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      await Promise.all(
        unreadNotifications.map((n) =>
          updateDoc(doc(db, "notifications", n.id), { read: true }),
        ),
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}

// 🔹 Helper to create new notifications
export async function createNotification({
  recipientId,
  type,
  recordId,
  meetingUpdateId,
  message,
  createdById,
  createdByName,
}: {
  recipientId: string;
  type: NotificationType;
  recordId: string;
  meetingUpdateId?: string;
  message: string;
  createdById: string;
  createdByName: string;
}) {
  try {
    await addDoc(collection(db, "notifications"), {
      recipientId,
      type,
      recordId,
      meetingUpdateId: meetingUpdateId || null,
      message,
      createdById,
      createdByName,
      createdAt: serverTimestamp(),
      read: false,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
