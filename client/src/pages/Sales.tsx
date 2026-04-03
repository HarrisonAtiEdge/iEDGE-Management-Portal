// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { useAuth } from "@/contexts/AuthContext";
// import { SalesRecordModal } from "@/components/SalesRecordModal";
// import {
//   collection,
//   query,
//   where,
//   onSnapshot,
//   orderBy,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import type { SalesRecord } from "@shared/schema";
// import { mapSalesRecordForBackwardCompatibility } from "@shared/schema";

// export function Sales() {
//   const { userProfile } = useAuth();
//   const [records, setRecords] = useState<SalesRecord[]>([]);
//   const [clients, setClients] = useState<any[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingRecord, setEditingRecord] = useState<SalesRecord | undefined>();
//   const [loading, setLoading] = useState(true);
//   const PANEL_ID = "IEDGE-SYSTEM";

//   collection(db, "Panels", PANEL_ID, "clients");
// collection(db, "Panels", PANEL_ID, "salesRecords");


//   // Fetch clients added by finance or the finance admin
//   useEffect(() => {
//     // const clientQuery = query(collection(db, "clients"));
//     const clientQuery = query(
//   collection(db, "Panels", "IEDGE-SYSTEM", "clients")
// );

//     const unsubscribe = onSnapshot(clientQuery, (snapshot) => {
//       const clientsData = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       setClients(clientsData);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Listen for real-time updates to sales records
//   useEffect(() => {
//     if (!userProfile) return;

//     // const q = query(
//     //   collection(db, "salesRecords"),
//     //   where("salesPersonId", "==", userProfile.id),
//     //   orderBy("updatedAt", "desc"),
//     // );

//     const q = query(
//   collection(db, "Panels", "IEDGE-SYSTEM", "salesRecords"),
//   where("salesPersonId", "==", userProfile.id),
//   orderBy("updatedAt", "desc"),
// );


//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const recordsData = snapshot.docs.map((doc) => {
//         const rawData = { id: doc.id, ...doc.data() };
//         return mapSalesRecordForBackwardCompatibility(rawData);
//       }) as SalesRecord[];

//       setRecords(recordsData);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [userProfile]);

//   const handleAddRecord = () => {
//     setEditingRecord(undefined);
//     setIsModalOpen(true);
//   };

//   const handleEditRecord = (record: SalesRecord) => {
//     setEditingRecord(record);
//     setIsModalOpen(true);
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
//           <p className="text-gray-500">Loading sales records...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-bold text-foreground">Sales Dashboard</h1>
//         <Button
//           onClick={handleAddRecord}
//           className="bg-green-600 hover:bg-green-700 text-white"
//           data-testid="button-add-record"
//         >
//           Add New Project
//         </Button>
//       </div>

//       <SalesRecordModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         editingRecord={editingRecord}
//         clients={clients} // Pass the client list here
//       />

//       <table className="min-w-full bg-white border border-gray-200">
//         <thead>
//           <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
//             <th className="py-3 px-6 text-left">Client</th>
//             <th className="py-3 px-6 text-left">Project</th>
//             <th className="py-3 px-6 text-left">Projected Value</th>
//             <th className="py-3 px-6 text-center">Actions</th>
//           </tr>
//         </thead>
//         <tbody className="text-gray-600 text-sm font-light">
//           {records.length > 0 ? (
//             records.map((record) => (
//               <tr key={record.id}>
//                 <td className="py-3 px-6">{record.client}</td>
//                 <td className="py-3 px-6">
//                   <div>
//                     <div className="font-medium">{record.projectName}</div>
//                     <div className="text-sm text-green-600 font-semibold">
//                       Estimated Commission Rs{" "}
//                       {Math.round(
//                         record.projectedValue * 0.01,
//                       ).toLocaleString()}
//                     </div>
//                   </div>
//                 </td>
//                 <td className="py-3 px-6">
//                   <div>
//                     <div className="font-medium">
//                       Rs {record.projectedValue.toLocaleString()}
//                     </div>
//                     {record.wonValue > 0 && (
//                       <div className="text-sm text-gray-600">
//                         Won: Rs {record.wonValue.toLocaleString()}
//                       </div>
//                     )}
//                   </div>
//                 </td>
//                 <td className="py-3 px-6 text-center">
//                   <Button
//                     onClick={() => handleEditRecord(record)}
//                     className="bg-blue-600 hover:bg-blue-700 text-white"
//                   >
//                     Update
//                   </Button>
//                 </td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan={4} className="text-center py-4">
//                 No sales records found.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }



import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SalesRecordModal } from "@/components/SalesRecordModal";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SalesRecord } from "@shared/schema";
import { mapSalesRecordForBackwardCompatibility } from "@shared/schema";

type SalesAccessPermissions = {
  canViewRecord: boolean;
  canEditRecord: boolean;
  canManageMeetings: boolean;
  canCreateEstimate: boolean;
  canComment: boolean;
  isOwner: boolean;
  isSupervisor: boolean;
  isCustodian: boolean;
  isAssignedAdmin: boolean;
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeRole(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getSalesRecordPermissions(record: any, currentUserId: string): SalesAccessPermissions {
  const projectCustodians = normalizeStringArray(record?.projectCustodians);
  const supervisors = normalizeStringArray(record?.supervisors);
  const adminParticipantIds = normalizeStringArray(record?.adminParticipantIds);
  const canViewUserIds = normalizeStringArray(
    record?.canViewUserIds?.length ? record?.canViewUserIds : record?.accessUserIds,
  );
  const canEditUserIds = normalizeStringArray(record?.canEditUserIds);
  const canManageMeetingUserIds = normalizeStringArray(
    record?.canManageMeetingUserIds?.length
      ? record?.canManageMeetingUserIds
      : canViewUserIds,
  );
  const canCreateEstimateUserIds = normalizeStringArray(
    record?.canCreateEstimateUserIds?.length
      ? record?.canCreateEstimateUserIds
      : canEditUserIds,
  );
  const canCommentUserIds = normalizeStringArray(
    record?.canCommentUserIds?.length ? record?.canCommentUserIds : canViewUserIds,
  );

  const isOwner = String(record?.salesPersonId || "") === currentUserId;
  const isSupervisor = supervisors.includes(currentUserId);
  const isCustodian = projectCustodians.includes(currentUserId);
  const isAssignedAdmin =
    String(record?.assignedAdminId || "") === currentUserId ||
    adminParticipantIds.includes(currentUserId);

  const canViewRecord =
    isOwner ||
    isSupervisor ||
    isCustodian ||
    isAssignedAdmin ||
    canViewUserIds.includes(currentUserId);

  const canEditRecord =
    isOwner ||
    isSupervisor ||
    isAssignedAdmin ||
    canEditUserIds.includes(currentUserId);

  const canManageMeetings =
    canViewRecord ||
    canManageMeetingUserIds.includes(currentUserId);

  const canCreateEstimate =
    canEditRecord ||
    canCreateEstimateUserIds.includes(currentUserId);

  const canComment =
    canViewRecord ||
    canCommentUserIds.includes(currentUserId);

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

export function Sales() {
  const { userProfile, currentUser } = useAuth();
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | undefined>();
  const [loading, setLoading] = useState(true);
  const PANEL_ID = "IEDGE-SYSTEM";
  const actorId = currentUser?.uid || userProfile?.id || "";

  // Fetch clients
  useEffect(() => {
    const clientQuery = query(
      collection(db, "Panels", PANEL_ID, "clients"),
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

  // Listen for real-time updates to sales records that the current user can access
  useEffect(() => {
    if (!userProfile || !actorId) return;

    const salesRecordsQuery = query(
      collection(db, "Panels", PANEL_ID, "salesRecords"),
      orderBy("updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(salesRecordsQuery, (snapshot) => {
      const mappedRecords = snapshot.docs.map((doc) => {
        const rawData = { id: doc.id, ...doc.data() };
        return mapSalesRecordForBackwardCompatibility(rawData);
      }) as SalesRecord[];

      const visibleRecords = mappedRecords.filter((record: any) => {
        const permissions = getSalesRecordPermissions(record, actorId);
        return permissions.canViewRecord;
      });

      setRecords(visibleRecords);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile, actorId]);

  const permissionsByRecordId = useMemo(() => {
    const nextMap: Record<string, SalesAccessPermissions> = {};
    if (!actorId) return nextMap;

    records.forEach((record: any) => {
      nextMap[String(record.id)] = getSalesRecordPermissions(record, actorId);
    });

    return nextMap;
  }, [records, actorId]);

  const editingPermissions =
    editingRecord && editingRecord.id
      ? permissionsByRecordId[String(editingRecord.id)] || getSalesRecordPermissions(editingRecord, actorId)
      : undefined;

  const handleAddRecord = () => {
    setEditingRecord(undefined);
    setIsModalOpen(true);
  };

  const handleEditRecord = (record: SalesRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const canCreateProject =
    !!userProfile &&
    (normalizeRole(userProfile.role) === "sales" ||
      normalizeRole(userProfile.role).includes("admin"));

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
        {canCreateProject && (
          <Button
            onClick={handleAddRecord}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-add-record"
          >
            Add New Project
          </Button>
        )}
      </div>

      <SalesRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingRecord={editingRecord}
        clients={clients}
        viewerPermissions={editingPermissions}
      />

      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Client</th>
            <th className="py-3 px-6 text-left">Project</th>
            <th className="py-3 px-6 text-left">Projected Value</th>
            <th className="py-3 px-6 text-left">Access</th>
            <th className="py-3 px-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {records.length > 0 ? (
            records.map((record: any) => {
              const permissions =
                permissionsByRecordId[String(record.id)] ||
                getSalesRecordPermissions(record, actorId);

              const accessLabel = permissions.isOwner
                ? "Owner"
                : permissions.isSupervisor
                ? "Supervisor"
                : permissions.isCustodian
                ? "Custodian"
                : permissions.isAssignedAdmin
                ? "Admin"
                : "Viewer";

              return (
                <tr key={record.id}>
                  <td className="py-3 px-6">{record.client}</td>
                  <td className="py-3 px-6">
                    <div>
                      <div className="font-medium">{record.projectName}</div>
                      <div className="text-xs text-gray-500">{record.projectCode || "No code"}</div>
                      <div className="text-sm text-green-600 font-semibold">
                        Estimated Commission Rs{" "}
                        {Math.round(
                          (record.projectedValue || 0) * 0.01,
                        ).toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <div>
                      <div className="font-medium">
                        Rs {(record.projectedValue || 0).toLocaleString()}
                      </div>
                      {(record.wonValue || 0) > 0 && (
                        <div className="text-sm text-gray-600">
                          Won: Rs {(record.wonValue || 0).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {accessLabel}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Button
                      onClick={() => handleEditRecord(record)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {permissions.canEditRecord ? "Update" : permissions.canManageMeetings ? "Open" : "View"}
                    </Button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-4">
                No sales records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}