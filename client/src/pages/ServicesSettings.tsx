// import { useState, useEffect } from "react";
// import { db } from "@/lib/firebase";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   updateDoc,
//   deleteDoc,
//   doc,
// } from "firebase/firestore";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";

// interface Service {
//   id?: string;
//   name: string;
//   description?: string;
// }

// export default function ServicesSettings() {
//   const [services, setServices] = useState<Service[]>([]);
//   const [newService, setNewService] = useState({ name: "", description: "" });
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   // ✅ Fetch services from Firestore
//   useEffect(() => {
//     const fetchServices = async () => {
//       const querySnapshot = await getDocs(collection(db, "services"));
//       const data = querySnapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       })) as Service[];
//       setServices(data);
//     };
//     fetchServices();
//   }, []);

//   // ✅ Add or Update Service
//   const handleAddOrUpdate = async () => {
//     if (!newService.name.trim()) return alert("Service name is required");

//     setLoading(true);
//     try {
//       if (editingId) {
//         await updateDoc(doc(db, "services", editingId), newService);
//         setServices((prev) =>
//           prev.map((s) => (s.id === editingId ? { ...s, ...newService } : s))
//         );
//         setEditingId(null);
//       } else {
//         const docRef = await addDoc(collection(db, "services"), newService);
//         setServices((prev) => [...prev, { id: docRef.id, ...newService }]);
//       }

//       setNewService({ name: "", description: "" });
//     } catch (err) {
//       console.error("Error saving service:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Edit
//   const handleEdit = (service: Service) => {
//     setEditingId(service.id || null);
//     setNewService({
//       name: service.name,
//       description: service.description || "",
//     });
//   };

//   // ✅ Delete
//   const handleDelete = async (id?: string) => {
//     if (!id) return;
//     if (!confirm("Delete this service?")) return;
//     await deleteDoc(doc(db, "services", id));
//     setServices((prev) => prev.filter((s) => s.id !== id));
//   };

//   return (
//     <div className="space-y-6">
//       {/* Add / Edit Form */}
//       <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
//         <h2 className="text-lg font-medium">
//           {editingId ? "Edit Service" : "Add New Service"}
//         </h2>

//         <Input
//           placeholder="Service name"
//           value={newService.name}
//           onChange={(e) =>
//             setNewService({ ...newService, name: e.target.value })
//           }
//         />
//         <Textarea
//           placeholder="Description (optional)"
//           value={newService.description}
//           onChange={(e) =>
//             setNewService({ ...newService, description: e.target.value })
//           }
//         />

//         <Button onClick={handleAddOrUpdate} disabled={loading}>
//           {loading ? "Saving..." : editingId ? "Update" : "Add"}
//         </Button>
//       </div>

//       {/* Existing Services */}
//       <div className="p-4 border rounded-lg bg-gray-50">
//         <h2 className="text-lg font-medium mb-3">Existing Services</h2>
//         {services.length === 0 ? (
//           <p className="text-sm text-gray-600">No services found.</p>
//         ) : (
//           <table className="w-full border text-sm">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="border p-2 text-left">Name</th>
//                 <th className="border p-2 text-left">Description</th>
//                 <th className="border p-2 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {services.map((s) => (
//                 <tr key={s.id}>
//                   <td className="border p-2">{s.name}</td>
//                   <td className="border p-2">
//                     {s.description || <span className="text-gray-400">-</span>}
//                   </td>
//                   <td className="border p-2 text-center space-x-2">
//                     <Button
//                       size="sm"
//                       variant="secondary"
//                       onClick={() => handleEdit(s)}
//                     >
//                       Edit
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="destructive"
//                       onClick={() => handleDelete(s.id)}
//                     >
//                       Delete
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Service {
  id?: string;
  name: string;
  description?: string;
}

export default function ServicesSettings() {
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const servicesRef = collection(
  db,
  "Panels",
  "IEDGE-SYSTEM",
  "services"
);


  useEffect(() => {
  const fetchServices = async () => {
    const querySnapshot = await getDocs(servicesRef);
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Service[];
    setServices(data);
  };
  fetchServices();
}, []);


  // ✅ Add or Update Service

  const handleAddOrUpdate = async () => {
  if (!newService.name.trim()) return alert("Service name is required");

  setLoading(true);
  try {
    if (editingId) {
      await updateDoc(
        doc(db, "Panels", "IEDGE-SYSTEM", "services", editingId),
        newService
      );

      setServices((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, ...newService } : s
        )
      );
      setEditingId(null);
    } else {
      const docRef = await addDoc(servicesRef, newService);
      setServices((prev) => [
        ...prev,
        { id: docRef.id, ...newService },
      ]);
    }

    setNewService({ name: "", description: "" });
  } catch (err) {
    console.error("Error saving service:", err);
  } finally {
    setLoading(false);
  }
};


  // ✅ Edit
  const handleEdit = (service: Service) => {
    setEditingId(service.id || null);
    setNewService({
      name: service.name,
      description: service.description || "",
    });
  };

  // ✅ Delete

  const handleDelete = async (id?: string) => {
  if (!id) return;
  if (!confirm("Delete this service?")) return;

  await deleteDoc(
    doc(db, "Panels", "IEDGE-SYSTEM", "services", id)
  );

  setServices((prev) => prev.filter((s) => s.id !== id));
};


  return (
    <div className="space-y-6">
      {/* Add / Edit Form */}
      <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
        <h2 className="text-lg font-medium">
          {editingId ? "Edit Service" : "Add New Service"}
        </h2>

        <Input
          placeholder="Service name"
          value={newService.name}
          onChange={(e) =>
            setNewService({ ...newService, name: e.target.value })
          }
        />
        <Textarea
          placeholder="Description (optional)"
          value={newService.description}
          onChange={(e) =>
            setNewService({ ...newService, description: e.target.value })
          }
        />

        <Button onClick={handleAddOrUpdate} disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update" : "Add"}
        </Button>
      </div>

      {/* Existing Services */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-medium mb-3">Existing Services</h2>
        {services.length === 0 ? (
          <p className="text-sm text-gray-600">No services found.</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">
                    {s.description || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="border p-2 text-center space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(s)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
