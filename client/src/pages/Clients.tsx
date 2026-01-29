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

//   const clientsRef = collection(
//   db,
//   "Panels",
//   "IEDGE-SYSTEM",
//   "clients"
// );

//   const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();

//   const clientData = {
//     name: clientName,
//     mobile: clientMobile,
//     addtionalInfo,
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
//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "clients", editingClientId),
//         clientData
//       );
//       alert("Client updated successfully!");
//     } else {
//       await addDoc(clientsRef, {
//         ...clientData,
//         createdAt: new Date(),
//       });
//       alert("Client added successfully!");
//     }

//     resetForm();
//   } catch (error) {
//     console.error("Error saving client:", error);
//     alert("There was an error saving the client.");
//   }
// };

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

//   useEffect(() => {
//   const q = query(clientsRef);

//   const unsubscribe = onSnapshot(q, (snapshot) => {
//     const clientsData = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));
//     setClientsList(clientsData);
//   });

//   return () => unsubscribe();
// }, []);

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
//    <div className="space-y-4">
//   {/* Toggle Button */}
//   <div className="flex justify-end">
//     <Button size="sm" onClick={() => setIsFormVisible(!isFormVisible)}>
//       {isFormVisible ? "Cancel" : "Add Client"}
//     </Button>
//   </div>

//   {/* Form */}
//   {isFormVisible && (
//     <div className="bg-white shadow rounded-lg p-4">
//       <h1 className="text-lg font-semibold mb-3 border-b pb-1">
//         {editingClientId ? "Edit Client" : "Add New Client"}
//       </h1>

//       <form
//         onSubmit={handleSubmit}
//         className="grid grid-cols-1 md:grid-cols-4 gap-3"
//       >
//         <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Name" required />
//         <Input value={addtionalInfo} onChange={(e) => setAddtionalInfo(e.target.value)} placeholder="Additional Info" />
//         <Input value={clientMobile} onChange={(e) => setClientMobile(e.target.value)} placeholder="Mobile" />
//         <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Phone" />
//         <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email" />
//         <Input value={clientWeb} onChange={(e) => setClientWeb(e.target.value)} placeholder="Website" />
//         <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Address" />
//         <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
//         <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Zip" />
//         <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
//         <Input value={ntn} onChange={(e) => setNtn(e.target.value)} placeholder="NTN" />

// {/* horizontal line break

// here add Label: Rates (Bold)
// Label: marketing services
// Label: accommodation  and inputBox
// Label: travel and inputBox
// Label: transport  and inputBox
// Label: ltd/lsp and inputBox */}

//         <div className="col-span-1 md:col-span-4 flex justify-end">
//           <Button size="sm" type="submit">
//             {editingClientId ? "Update" : "Add"}
//           </Button>
//         </div>
//       </form>
//     </div>
//   )}

//   {/* Table */}
//   <div className="bg-white shadow rounded-lg p-4">
//     <h2 className="text-lg font-semibold border-b mb-3 pb-1">
//       Clients
//     </h2>

//     <div className="overflow-x-auto border rounded">
//       <table className="min-w-full text-sm">
//         <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
//           <tr>
//             {["Name","Info","Mobile","Phone","Email","Web","Address","City","Zip","Country","NTN",""].map(h => (
//               <th key={h} className="py-2 px-3 text-left">{h}</th>
//             ))}
//           </tr>
//         </thead>

//         <tbody className="divide-y">
//           {clientsList.length ? (
//             clientsList.map((client) => (
//               <tr key={client.id} className="hover:bg-gray-50">
//                 <td className="py-2 px-3">{client.name}</td>
//                 <td className="py-2 px-3">{client.addtionalInfo}</td>
//                 <td className="py-2 px-3">{client.mobile}</td>
//                 <td className="py-2 px-3">{client.phone}</td>
//                 <td className="py-2 px-3">{client.email}</td>
//                 <td className="py-2 px-3">{client.web}</td>
//                 <td className="py-2 px-3">{client.address}</td>
//                 <td className="py-2 px-3">{client.city}</td>
//                 <td className="py-2 px-3">{client.zipCode}</td>
//                 <td className="py-2 px-3">{client.country}</td>
//                 <td className="py-2 px-3">{client.ntn}</td>
//                 <td className="py-2 px-3 text-center">
//                   <Button size="sm" variant="outline" onClick={() => handleEdit(client)}>
//                     Edit
//                   </Button>
//                 </td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan={12} className="py-8 text-center text-gray-400">
//                 No clients available
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   </div>
// </div>

//   );
// }

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const parseRate = (value: string) => {
  if (!value) return null;
  const cleaned = value.replace("%", "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
};

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

  // ✅ Rates
  const [marketingRate, setMarketingRate] = useState("");
  const [accommodationRate, setAccommodationRate] = useState("");
  const [travelRate, setTravelRate] = useState("");
  const [transportRate, setTransportRate] = useState("");
  const [ltdLspRate, setLtdLspRate] = useState("");

  const [clientsList, setClientsList] = useState<any[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const clientsRef = collection(db, "Panels", "IEDGE-SYSTEM", "clients");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const clientData = {
      name: clientName,
      addtionalInfo,
      mobile: clientMobile,
      phone: clientPhone,
      email: clientEmail,
      web: clientWeb,
      address: clientAddress,
      city,
      zipCode,
      country,
      ntn,

      // ✅ Rates saved as numbers
      rates: {
        marketingServices: parseRate(marketingRate),
        accommodation: parseRate(accommodationRate),
        travel: parseRate(travelRate),
        transport: parseRate(transportRate),
        ltdLsp: parseRate(ltdLspRate),
      },

      updatedAt: new Date(),
    };

    try {
      if (editingClientId) {
        await updateDoc(
          doc(db, "Panels", "IEDGE-SYSTEM", "clients", editingClientId),
          clientData,
        );
      } else {
        await addDoc(clientsRef, { ...clientData, createdAt: new Date() });
      }
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setClientName("");
    setAddtionalInfo("");
    setClientMobile("");
    setClientPhone("");
    setClientEmail("");
    setClientWeb("");
    setClientAddress("");
    setCity("");
    setZipCode("");
    setCountry("");
    setNtn("");

    setMarketingRate("");
    setAccommodationRate("");
    setTravelRate("");
    setTransportRate("");
    setLtdLspRate("");

    setEditingClientId(null);
    setIsFormVisible(false);
  };

  useEffect(() => {
    const q = query(clientsRef);
    const unsub = onSnapshot(q, (snap) => {
      setClientsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleEdit = (client: any) => {
    setEditingClientId(client.id);
    setClientName(client.name || "");
    setAddtionalInfo(client.addtionalInfo || "");
    setClientMobile(client.mobile || "");
    setClientPhone(client.phone || "");
    setClientEmail(client.email || "");
    setClientWeb(client.web || "");
    setClientAddress(client.address || "");
    setCity(client.city || "");
    setZipCode(client.zipCode || "");
    setCountry(client.country || "");
    setNtn(client.ntn || "");

    setMarketingRate(client.rates?.marketingServices?.toString() || "");
    setAccommodationRate(client.rates?.accommodation?.toString() || "");
    setTravelRate(client.rates?.travel?.toString() || "");
    setTransportRate(client.rates?.transport?.toString() || "");
    setLtdLspRate(client.rates?.ltdLsp?.toString() || "");

    setIsFormVisible(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <Button size="sm" onClick={() => setIsFormVisible(!isFormVisible)}>
          {isFormVisible ? "Cancel" : "Add Client"}
        </Button>
      </div>

      {isFormVisible && (
        <div className="bg-white shadow rounded-lg p-4 max-h-[70vh] overflow-y-auto">
          <h1 className="text-lg font-semibold mb-3 border-b pb-1">
            {editingClientId ? "Edit Client" : "Add New Client"}
          </h1>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client Name"
            />
            <Input
              value={addtionalInfo}
              onChange={(e) => setAddtionalInfo(e.target.value)}
              placeholder="Additional Info"
            />
            <Input
              value={clientMobile}
              onChange={(e) => setClientMobile(e.target.value)}
              placeholder="Mobile"
            />
            <Input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Phone"
            />
            <Input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Email"
            />
            <Input
              value={clientWeb}
              onChange={(e) => setClientWeb(e.target.value)}
              placeholder="Website"
            />
            <Input
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Address"
            />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
            />
            <Input
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Zip"
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

            <div className="col-span-4 border-t pt-3 font-semibold">
              Rates (%)
            </div>

            <Input
              value={marketingRate}
              onChange={(e) => setMarketingRate(e.target.value)}
              placeholder="Marketing Services %"
            />
            <Input
              value={accommodationRate}
              onChange={(e) => setAccommodationRate(e.target.value)}
              placeholder="Accommodation %"
            />
            <Input
              value={travelRate}
              onChange={(e) => setTravelRate(e.target.value)}
              placeholder="Travel %"
            />
            <Input
              value={transportRate}
              onChange={(e) => setTransportRate(e.target.value)}
              placeholder="Transport %"
            />
            <Input
              value={ltdLspRate}
              onChange={(e) => setLtdLspRate(e.target.value)}
              placeholder="LTD / LSP %"
            />

            <div className="col-span-4 flex justify-start">
              <Button size="sm" type="submit">
                {editingClientId ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-4">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0">
            <tr>
              {[
                "Name",
                "Info",
                "Mobile",
                "Phone",
                "Email",
                "Web",
                "Address",
                "City",
                "Zip",
                "Country",
                "NTN",
                "Marketing %",
                "Accommodation %",
                "Travel %",
                "Transport %",
                "LTD/LSP %",
                "Actions",
              ].map((h) => (
                <th key={h} className="py-2 px-3 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {clientsList.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="py-2 px-3">{client.name}</td>
                <td className="py-2 px-3">{client.addtionalInfo}</td>
                <td className="py-2 px-3">{client.mobile}</td>
                <td className="py-2 px-3">{client.phone}</td>
                <td className="py-2 px-3">{client.email}</td>
                <td className="py-2 px-3">{client.web}</td>
                <td className="py-2 px-3">{client.address}</td>
                <td className="py-2 px-3">{client.city}</td>
                <td className="py-2 px-3">{client.zipCode}</td>
                <td className="py-2 px-3">{client.country}</td>
                <td className="py-2 px-3">{client.ntn}</td>

                <td className="py-2 px-3">
                  {client.rates?.marketingServices ?? "-"}%
                </td>
                <td className="py-2 px-3">
                  {client.rates?.accommodation ?? "-"}%
                </td>
                <td className="py-2 px-3">{client.rates?.travel ?? "-"}%</td>
                <td className="py-2 px-3">{client.rates?.transport ?? "-"}%</td>
                <td className="py-2 px-3">{client.rates?.ltdLsp ?? "-"}%</td>

                <td className="py-2 px-3 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(client)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
