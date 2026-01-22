import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  QueryConstraint,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useFirestoreCollection<T = DocumentData>(
  collectionName: string, 
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ 
            id: doc.id, 
            ...doc.data(),
            // Convert Firebase timestamps to dates
            submittedAt: doc.data().submittedAt?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            dueDate: doc.data().dueDate?.toDate(),
            acknowledgedAt: doc.data().acknowledgedAt?.toDate()
          } as T);
        });
        setData(items);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Firestore error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
}

export function useFirestoreQuery<T = DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
) {
  return useFirestoreCollection<T>(collectionName, constraints);
}
