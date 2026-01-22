import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SalesRecordModal } from "@/components/SalesRecordModal";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalesRecord } from "@shared/schema";
import { mapSalesRecordForBackwardCompatibility } from "@shared/schema";

export function Sales() {
  const { userProfile } = useAuth();
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | undefined>();
  const [loading, setLoading] = useState(true);
  const PANEL_ID = "IEDGE-SYSTEM";

  collection(db, "Panels", PANEL_ID, "clients");
collection(db, "Panels", PANEL_ID, "salesRecords");


  // Fetch clients added by finance or the finance admin
  useEffect(() => {
    // const clientQuery = query(collection(db, "clients"));
    const clientQuery = query(
  collection(db, "Panels", "IEDGE-SYSTEM", "clients")
);

    const unsubscribe = onSnapshot(clientQuery, (snapshot) => {
      const clientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsData);
    });

    return () => unsubscribe();
  }, []);

  // Listen for real-time updates to sales records
  useEffect(() => {
    if (!userProfile) return;

    // const q = query(
    //   collection(db, "salesRecords"),
    //   where("salesPersonId", "==", userProfile.id),
    //   orderBy("updatedAt", "desc"),
    // );

    const q = query(
  collection(db, "Panels", "IEDGE-SYSTEM", "salesRecords"),
  where("salesPersonId", "==", userProfile.id),
  orderBy("updatedAt", "desc"),
);


    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map((doc) => {
        const rawData = { id: doc.id, ...doc.data() };
        return mapSalesRecordForBackwardCompatibility(rawData);
      }) as SalesRecord[];

      setRecords(recordsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleAddRecord = () => {
    setEditingRecord(undefined);
    setIsModalOpen(true);
  };

  const handleEditRecord = (record: SalesRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-500">Loading sales records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Sales Dashboard</h1>
        <Button
          onClick={handleAddRecord}
          className="bg-green-600 hover:bg-green-700 text-white"
          data-testid="button-add-record"
        >
          Add New Project
        </Button>
      </div>

      <SalesRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingRecord={editingRecord}
        clients={clients} // Pass the client list here
      />

      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Client</th>
            <th className="py-3 px-6 text-left">Project</th>
            <th className="py-3 px-6 text-left">Projected Value</th>
            <th className="py-3 px-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {records.length > 0 ? (
            records.map((record) => (
              <tr key={record.id}>
                <td className="py-3 px-6">{record.client}</td>
                <td className="py-3 px-6">
                  <div>
                    <div className="font-medium">{record.projectName}</div>
                    <div className="text-sm text-green-600 font-semibold">
                      Estimated Commission Rs{" "}
                      {Math.round(
                        record.projectedValue * 0.01,
                      ).toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-6">
                  <div>
                    <div className="font-medium">
                      Rs {record.projectedValue.toLocaleString()}
                    </div>
                    {record.wonValue > 0 && (
                      <div className="text-sm text-gray-600">
                        Won: Rs {record.wonValue.toLocaleString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-6 text-center">
                  <Button
                    onClick={() => handleEditRecord(record)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Update
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4">
                No sales records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
