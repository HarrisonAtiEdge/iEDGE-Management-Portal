
// import { useState, useEffect } from "react";
// import { db } from "@/lib/firebase";
// import { collection, addDoc, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// export function Clients() {
//   const [clientName, setClientName] = useState("");
//    const [addtionalInfo, setAddtionalInfo] = useState("");
//   const [clientMobile, setClientMobile] = useState("");
//   const [clientPhone, setClientPhone] = useState("");
//   const [clientEmail, setClientEmail] = useState("");
//   const [clientWeb, setClientWeb] = useState("");
//   const [clientAddress, setClientAddress] = useState("");
//   const [city, setCity] = useState("");
//   const [zipCode, setZipCode] = useState("");
//   const [country, setCountry] = useState("");
//   const [ntn, setNtn] = useState("");
//   const [clientsList, setClientsList] = useState<any[]>([]);
//   const [isFormVisible, setIsFormVisible] = useState(false);
//   const [editingClientId, setEditingClientId] = useState<string | null>(null);

//   // ✅ Add or Update Client
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const clientData = {
//       name: clientName,
//       mobile: clientMobile,
//        addtionalInfo: addtionalInfo,
//       phone: clientPhone,
//       email: clientEmail,
//       web: clientWeb,
//       address: clientAddress,
//       city,
//       zipCode,
//       country,
//       ntn,
//       updatedAt: new Date(),
//     };

//     try {
//       if (editingClientId) {
//         // 🔹 Update existing client
//         const clientRef = doc(db, "clients", editingClientId);
//         await updateDoc(clientRef, clientData);
//         alert("Client updated successfully!");
//       } else {
//         // 🔹 Add new client
//         await addDoc(collection(db, "clients"), {
//           ...clientData,
//           createdAt: new Date(),
//         });
//         alert("Client added successfully!");
//       }

//       resetForm();
//     } catch (error) {
//       console.error("Error saving client: ", error);
//       alert("There was an error saving the client.");
//     }
//   };

//   // ✅ Reset form
//   const resetForm = () => {
//     setClientName("");
//     setClientMobile("");
//      setAddtionalInfo("");
//     setClientPhone("");
//     setClientEmail("");
//     setClientWeb("");
//     setClientAddress("");
//     setCity("");
//     setZipCode("");
//     setCountry("");
//     setNtn("");
//     setEditingClientId(null);
//     setIsFormVisible(false);
//   };

//   // ✅ Fetch Clients
//   useEffect(() => {
//     const q = query(collection(db, "clients"));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const clientsData = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       setClientsList(clientsData);
//     });

//     return () => unsubscribe();
//   }, []);

//   // ✅ Handle Edit
//   const handleEdit = (client: any) => {
//     setEditingClientId(client.id);
//     setClientName(client.name);
//     setClientMobile(client.mobile || "");
//     setAddtionalInfo(client.addtionalInfo || "");
//     setClientPhone(client.phone || "");
//     setClientEmail(client.email || "");
//     setClientWeb(client.web || "");
//     setClientAddress(client.address || "");
//     setCity(client.city || "");
//     setZipCode(client.zipCode || "");
//     setCountry(client.country || "");
//     setNtn(client.ntn || "");
//     setIsFormVisible(true);
//   };

//   return (
//     <div className="space-y-8">
//       {/* Button to toggle form visibility */}
//       <div className="flex justify-end">
//         <Button onClick={() => setIsFormVisible(!isFormVisible)}>
//           {isFormVisible ? "Cancel" : "Add Client"}
//         </Button>
//       </div>

//       {/* Form Section */}
//       {isFormVisible && (
//         <div className="bg-white shadow-md rounded-xl p-6">
//           <h1 className="text-2xl font-semibold mb-4 border-b pb-2">
//             {editingClientId ? "Edit Client" : "Add New Client"}
//           </h1>
//           <form
//             onSubmit={handleSubmit}
//             className="grid grid-cols-1 md:grid-cols-2 gap-4"
//           >
//             <Input
//               value={clientName}
//               onChange={(e) => setClientName(e.target.value)}
//               placeholder="Client Name"
//               required
//             />
//                <Input
//               value={addtionalInfo}
//               onChange={(e) => setAddtionalInfo(e.target.value)}
//               placeholder="Addtional Info"
              
//             />
//             <Input
//               value={clientMobile}
//               onChange={(e) => setClientMobile(e.target.value)}
//               placeholder="Client Mobile"
//             />
//             <Input
//               value={clientPhone}
//               onChange={(e) => setClientPhone(e.target.value)}
//               placeholder="Client Phone"
//             />
//             <Input
//               value={clientEmail}
//               onChange={(e) => setClientEmail(e.target.value)}
//               placeholder="Client Email"
//             />
//             <Input
//               value={clientWeb}
//               onChange={(e) => setClientWeb(e.target.value)}
//               placeholder="Client Website"
//             />
//             <Input
//               value={clientAddress}
//               onChange={(e) => setClientAddress(e.target.value)}
//               placeholder="Client Address"
//             />
//             <Input
//               value={city}
//               onChange={(e) => setCity(e.target.value)}
//               placeholder="City"
//             />
//             <Input
//               value={zipCode}
//               onChange={(e) => setZipCode(e.target.value)}
//               placeholder="Zip Code"
//             />
//             <Input
//               value={country}
//               onChange={(e) => setCountry(e.target.value)}
//               placeholder="Country"
//             />
//             <Input
//               value={ntn}
//               onChange={(e) => setNtn(e.target.value)}
//               placeholder="NTN"
//             />
//             <div className="col-span-1 md:col-span-2 flex justify-end mt-2">
//               <Button type="submit" className="px-6">
//                 {editingClientId ? "Update Client" : "Add Client"}
//               </Button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* Clients Table */}
//       <div className="bg-white shadow-md rounded-xl p-6">
//         <h2 className="text-xl font-semibold border-b mb-4">Clients List</h2>
//         <div className="overflow-x-auto rounded-lg border border-gray-200">
//           <table className="min-w-full bg-white">
//             <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
//               <tr>
//                 <th className="py-3 px-6 text-left">Name</th>
//                 <th className="py-3 px-6 text-left">Addtional Info</th>
//                 <th className="py-3 px-6 text-left">Mobile</th>
//                 <th className="py-3 px-6 text-left">Phone</th>
//                 <th className="py-3 px-6 text-left">Email</th>
//                 <th className="py-3 px-6 text-left">Web</th>
//                 <th className="py-3 px-6 text-left">Address</th>
//                 <th className="py-3 px-6 text-left">City</th>
//                 <th className="py-3 px-6 text-left">Zip</th>
//                 <th className="py-3 px-6 text-left">Country</th>
//                 <th className="py-3 px-6 text-left">NTN</th>
//                 <th className="py-3 px-6 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
//               {clientsList.length > 0 ? (
//                 clientsList.map((client) => (
//                   <tr key={client.id}>
//                     <td className="py-3 px-6">{client.name}</td>
//                      <td className="py-3 px-6">{client.addtionalInfo}</td>
//                     <td className="py-3 px-6">{client.mobile}</td>
//                     <td className="py-3 px-6">{client.phone}</td>
//                     <td className="py-3 px-6">{client.email}</td>
//                     <td className="py-3 px-6">{client.web}</td>
//                     <td className="py-3 px-6">{client.address}</td>
//                     <td className="py-3 px-6">{client.city}</td>
//                     <td className="py-3 px-6">{client.zipCode}</td>
//                     <td className="py-3 px-6">{client.country}</td>
//                     <td className="py-3 px-6">{client.ntn}</td>
//                     <td className="py-3 px-6 text-center">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => handleEdit(client)}
//                       >
//                         Edit
//                       </Button>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
//                     No clients available.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Clients() {
  const [clientName, setClientName] = useState("");
   const [addtionalInfo, setAddtionalInfo] = useState("");
  const [clientMobile, setClientMobile] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientWeb, setClientWeb] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("");
  const [ntn, setNtn] = useState("");
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const clientsRef = collection(
  db,
  "Panels",
  "IEDGE-SYSTEM",
  "clients"
);


  // ✅ Add or Update Client
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   const clientData = {
  //     name: clientName,
  //     mobile: clientMobile,
  //      addtionalInfo: addtionalInfo,
  //     phone: clientPhone,
  //     email: clientEmail,
  //     web: clientWeb,
  //     address: clientAddress,
  //     city,
  //     zipCode,
  //     country,
  //     ntn,
  //     updatedAt: new Date(),
  //   };

  //   try {
  //     if (editingClientId) {
  //       // 🔹 Update existing client
  //       const clientRef = doc(db, "clients", editingClientId);
  //       await updateDoc(clientRef, clientData);
  //       alert("Client updated successfully!");
  //     } else {
  //       // 🔹 Add new client
  //       await addDoc(collection(db, "clients"), {
  //         ...clientData,
  //         createdAt: new Date(),
  //       });
  //       alert("Client added successfully!");
  //     }

  //     resetForm();
  //   } catch (error) {
  //     console.error("Error saving client: ", error);
  //     alert("There was an error saving the client.");
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const clientData = {
    name: clientName,
    mobile: clientMobile,
    addtionalInfo,
    phone: clientPhone,
    email: clientEmail,
    web: clientWeb,
    address: clientAddress,
    city,
    zipCode,
    country,
    ntn,
    updatedAt: new Date(),
  };

  try {
    if (editingClientId) {
      await updateDoc(
        doc(db, "Panels", "IEDGE-SYSTEM", "clients", editingClientId),
        clientData
      );
      alert("Client updated successfully!");
    } else {
      await addDoc(clientsRef, {
        ...clientData,
        createdAt: new Date(),
      });
      alert("Client added successfully!");
    }

    resetForm();
  } catch (error) {
    console.error("Error saving client:", error);
    alert("There was an error saving the client.");
  }
};


  // ✅ Reset form
  const resetForm = () => {
    setClientName("");
    setClientMobile("");
     setAddtionalInfo("");
    setClientPhone("");
    setClientEmail("");
    setClientWeb("");
    setClientAddress("");
    setCity("");
    setZipCode("");
    setCountry("");
    setNtn("");
    setEditingClientId(null);
    setIsFormVisible(false);
  };

  // ✅ Fetch Clients
  // useEffect(() => {
  //   const q = query(collection(db, "clients"));
  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     const clientsData = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //     setClientsList(clientsData);
  //   });

  //   return () => unsubscribe();
  // }, []);

  useEffect(() => {
  const q = query(clientsRef);

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const clientsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setClientsList(clientsData);
  });

  return () => unsubscribe();
}, []);


  // ✅ Handle Edit
  const handleEdit = (client: any) => {
    setEditingClientId(client.id);
    setClientName(client.name);
    setClientMobile(client.mobile || "");
    setAddtionalInfo(client.addtionalInfo || "");
    setClientPhone(client.phone || "");
    setClientEmail(client.email || "");
    setClientWeb(client.web || "");
    setClientAddress(client.address || "");
    setCity(client.city || "");
    setZipCode(client.zipCode || "");
    setCountry(client.country || "");
    setNtn(client.ntn || "");
    setIsFormVisible(true);
  };

  return (
    <div className="space-y-8">
      {/* Button to toggle form visibility */}
      <div className="flex justify-end">
        <Button onClick={() => setIsFormVisible(!isFormVisible)}>
          {isFormVisible ? "Cancel" : "Add Client"}
        </Button>
      </div>

      {/* Form Section */}
      {isFormVisible && (
        <div className="bg-white shadow-md rounded-xl p-6">
          <h1 className="text-2xl font-semibold mb-4 border-b pb-2">
            {editingClientId ? "Edit Client" : "Add New Client"}
          </h1>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client Name"
              required
            />
               <Input
              value={addtionalInfo}
              onChange={(e) => setAddtionalInfo(e.target.value)}
              placeholder="Addtional Info"
              
            />
            <Input
              value={clientMobile}
              onChange={(e) => setClientMobile(e.target.value)}
              placeholder="Client Mobile"
            />
            <Input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Client Phone"
            />
            <Input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Client Email"
            />
            <Input
              value={clientWeb}
              onChange={(e) => setClientWeb(e.target.value)}
              placeholder="Client Website"
            />
            <Input
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Client Address"
            />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
            />
            <Input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Zip Code"
            />
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
            />
            <Input
              value={ntn}
              onChange={(e) => setNtn(e.target.value)}
              placeholder="NTN"
            />
            <div className="col-span-1 md:col-span-2 flex justify-end mt-2">
              <Button type="submit" className="px-6">
                {editingClientId ? "Update Client" : "Add Client"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h2 className="text-xl font-semibold border-b mb-4">Clients List</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Addtional Info</th>
                <th className="py-3 px-6 text-left">Mobile</th>
                <th className="py-3 px-6 text-left">Phone</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Web</th>
                <th className="py-3 px-6 text-left">Address</th>
                <th className="py-3 px-6 text-left">City</th>
                <th className="py-3 px-6 text-left">Zip</th>
                <th className="py-3 px-6 text-left">Country</th>
                <th className="py-3 px-6 text-left">NTN</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm divide-y divide-gray-200">
              {clientsList.length > 0 ? (
                clientsList.map((client) => (
                  <tr key={client.id}>
                    <td className="py-3 px-6">{client.name}</td>
                     <td className="py-3 px-6">{client.addtionalInfo}</td>
                    <td className="py-3 px-6">{client.mobile}</td>
                    <td className="py-3 px-6">{client.phone}</td>
                    <td className="py-3 px-6">{client.email}</td>
                    <td className="py-3 px-6">{client.web}</td>
                    <td className="py-3 px-6">{client.address}</td>
                    <td className="py-3 px-6">{client.city}</td>
                    <td className="py-3 px-6">{client.zipCode}</td>
                    <td className="py-3 px-6">{client.country}</td>
                    <td className="py-3 px-6">{client.ntn}</td>
                    <td className="py-3 px-6 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    No clients available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
