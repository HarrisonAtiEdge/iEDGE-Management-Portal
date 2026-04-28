// import { useState, useEffect } from "react";
// import { db } from "@/lib/firebase";
// import {
//   collection,
//   addDoc,
//   query,
//   onSnapshot,
//   doc,
//   updateDoc,
// } from "firebase/firestore";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// const parseRate = (value: string) => {
//   if (!value) return null;
//   const cleaned = value.replace("%", "").trim();
//   const num = Number(cleaned);
//   return isNaN(num) ? null : num;
// };

// export function Clients() {
//   const [clientName, setClientName] = useState("");
//   const [addtionalInfo, setAddtionalInfo] = useState("");
//   const [clientMobile, setClientMobile] = useState("");
//   const [clientPhone, setClientPhone] = useState("");
//   const [clientEmail, setClientEmail] = useState("");
//   const [clientWeb, setClientWeb] = useState("");
//   const [clientAddress, setClientAddress] = useState("");
//   const [city, setCity] = useState("");
//   const [zipCode, setZipCode] = useState("");
//   const [country, setCountry] = useState("");
//   const [ntn, setNtn] = useState("");

//   // ✅ Rates
//   const [marketingRate, setMarketingRate] = useState("");
//   const [accommodationRate, setAccommodationRate] = useState("");
//   const [travelRate, setTravelRate] = useState("");
//   const [transportRate, setTransportRate] = useState("");
//   const [ltdLspRate, setLtdLspRate] = useState("");

//   const [clientsList, setClientsList] = useState<any[]>([]);
//   const [isFormVisible, setIsFormVisible] = useState(false);
//   const [editingClientId, setEditingClientId] = useState<string | null>(null);

//   const clientsRef = collection(db, "Panels", "IEDGE-SYSTEM", "clients");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const clientData = {
//       name: clientName,
//       addtionalInfo,
//       mobile: clientMobile,
//       phone: clientPhone,
//       email: clientEmail,
//       web: clientWeb,
//       address: clientAddress,
//       city,
//       zipCode,
//       country,
//       ntn,

//       // ✅ Rates saved as numbers
//       rates: {
//         marketingServices: parseRate(marketingRate),
//         accommodation: parseRate(accommodationRate),
//         travel: parseRate(travelRate),
//         transport: parseRate(transportRate),
//         ltdLsp: parseRate(ltdLspRate),
//       },

//       updatedAt: new Date(),
//     };

//     try {
//       if (editingClientId) {
//         await updateDoc(
//           doc(db, "Panels", "IEDGE-SYSTEM", "clients", editingClientId),
//           clientData,
//         );
//       } else {
//         await addDoc(clientsRef, { ...clientData, createdAt: new Date() });
//       }
//       resetForm();
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const resetForm = () => {
//     setClientName("");
//     setAddtionalInfo("");
//     setClientMobile("");
//     setClientPhone("");
//     setClientEmail("");
//     setClientWeb("");
//     setClientAddress("");
//     setCity("");
//     setZipCode("");
//     setCountry("");
//     setNtn("");

//     setMarketingRate("");
//     setAccommodationRate("");
//     setTravelRate("");
//     setTransportRate("");
//     setLtdLspRate("");

//     setEditingClientId(null);
//     setIsFormVisible(false);
//   };

//   useEffect(() => {
//     const q = query(clientsRef);
//     const unsub = onSnapshot(q, (snap) => {
//       setClientsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//     });
//     return () => unsub();
//   }, []);

//   const handleEdit = (client: any) => {
//     setEditingClientId(client.id);
//     setClientName(client.name || "");
//     setAddtionalInfo(client.addtionalInfo || "");
//     setClientMobile(client.mobile || "");
//     setClientPhone(client.phone || "");
//     setClientEmail(client.email || "");
//     setClientWeb(client.web || "");
//     setClientAddress(client.address || "");
//     setCity(client.city || "");
//     setZipCode(client.zipCode || "");
//     setCountry(client.country || "");
//     setNtn(client.ntn || "");

//     setMarketingRate(client.rates?.marketingServices?.toString() || "");
//     setAccommodationRate(client.rates?.accommodation?.toString() || "");
//     setTravelRate(client.rates?.travel?.toString() || "");
//     setTransportRate(client.rates?.transport?.toString() || "");
//     setLtdLspRate(client.rates?.ltdLsp?.toString() || "");

//     setIsFormVisible(true);
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex justify-start">
//         <Button size="sm" onClick={() => setIsFormVisible(!isFormVisible)}>
//           {isFormVisible ? "Cancel" : "Add Client"}
//         </Button>
//       </div>

//       {isFormVisible && (
//         <div className="bg-white shadow rounded-lg p-4 max-h-[70vh] overflow-y-auto">
//           <h1 className="text-lg font-semibold mb-3 border-b pb-1">
//             {editingClientId ? "Edit Client" : "Add New Client"}
//           </h1>
//           <form
//             onSubmit={handleSubmit}
//             className="grid grid-cols-1 md:grid-cols-4 gap-3"
//           >
//             <Input
//               value={clientName}
//               onChange={(e) => setClientName(e.target.value)}
//               placeholder="Client Name"
//             />
//             <Input
//               value={addtionalInfo}
//               onChange={(e) => setAddtionalInfo(e.target.value)}
//               placeholder="Additional Info"
//             />
//             <Input
//               value={clientMobile}
//               onChange={(e) => setClientMobile(e.target.value)}
//               placeholder="Mobile"
//             />
//             <Input
//               value={clientPhone}
//               onChange={(e) => setClientPhone(e.target.value)}
//               placeholder="Phone"
//             />
//             <Input
//               value={clientEmail}
//               onChange={(e) => setClientEmail(e.target.value)}
//               placeholder="Email"
//             />
//             <Input
//               value={clientWeb}
//               onChange={(e) => setClientWeb(e.target.value)}
//               placeholder="Website"
//             />
//             <Input
//               value={clientAddress}
//               onChange={(e) => setClientAddress(e.target.value)}
//               placeholder="Address"
//             />
//             <Input
//               value={city}
//               onChange={(e) => setCity(e.target.value)}
//               placeholder="City"
//             />
//             <Input
//               value={zipCode}
//               onChange={(e) => setZipCode(e.target.value)}
//               placeholder="Zip"
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

//             <div className="col-span-4 border-t pt-3 font-semibold">
//               Rates (%)
//             </div>

//             <Input
//               value={marketingRate}
//               onChange={(e) => setMarketingRate(e.target.value)}
//               placeholder="Marketing Services %"
//             />
//             <Input
//               value={accommodationRate}
//               onChange={(e) => setAccommodationRate(e.target.value)}
//               placeholder="Accommodation %"
//             />
//             <Input
//               value={travelRate}
//               onChange={(e) => setTravelRate(e.target.value)}
//               placeholder="Travel %"
//             />
//             <Input
//               value={transportRate}
//               onChange={(e) => setTransportRate(e.target.value)}
//               placeholder="Transport %"
//             />
//             <Input
//               value={ltdLspRate}
//               onChange={(e) => setLtdLspRate(e.target.value)}
//               placeholder="LTD / LSP %"
//             />

//             <div className="col-span-4 flex justify-start">
//               <Button size="sm" type="submit">
//                 {editingClientId ? "Update" : "Add"}
//               </Button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* Table */}
//       <div className="bg-white shadow rounded-lg p-4">
//         <table className="min-w-full text-xs">
//           <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0">
//             <tr>
//               {[
//                 "Name",
//                 "Info",
//                 "Mobile",
//                 "Phone",
//                 "Email",
//                 "Web",
//                 "Address",
//                 "City",
//                 "Zip",
//                 "Country",
//                 "NTN",
//                 "Marketing %",
//                 "Accommodation %",
//                 "Travel %",
//                 "Transport %",
//                 "LTD/LSP %",
//                 "Actions",
//               ].map((h) => (
//                 <th key={h} className="py-2 px-3 text-left whitespace-nowrap">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody className="divide-y">
//             {clientsList.map((client) => (
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

//                 <td className="py-2 px-3">
//                   {client.rates?.marketingServices ?? "-"}%
//                 </td>
//                 <td className="py-2 px-3">
//                   {client.rates?.accommodation ?? "-"}%
//                 </td>
//                 <td className="py-2 px-3">{client.rates?.travel ?? "-"}%</td>
//                 <td className="py-2 px-3">{client.rates?.transport ?? "-"}%</td>
//                 <td className="py-2 px-3">{client.rates?.ltdLsp ?? "-"}%</td>

//                 <td className="py-2 px-3 text-center">
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     onClick={() => handleEdit(client)}
//                   >
//                     Edit
//                   </Button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useMemo } from "react";
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
import {
  Eye,
  Edit2,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

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

  const [marketingRate, setMarketingRate] = useState("");
  const [accommodationRate, setAccommodationRate] = useState("");
  const [travelRate, setTravelRate] = useState("");
  const [transportRate, setTransportRate] = useState("");
  const [ltdLspRate, setLtdLspRate] = useState("");

  const [clientsList, setClientsList] = useState<any[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const clientsRef = collection(db, "Panels", "IEDGE-SYSTEM", "clients");

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return clientsList.filter((client) =>
      [
        client.name,
        client.addtionalInfo,
        client.mobile,
        client.phone,
        client.email,
        client.web,
        client.address,
        client.city,
        client.country,
        client.ntn,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [clientsList, searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / recordsPerPage) || 1;

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      setSelectedClient(null);
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

    setSelectedClient(null);
    setIsFormVisible(true);
  };

  const DetailItem = ({ label, value }: { label: string; value: any }) => (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value || "-"}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Users className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
              <p className="text-sm text-gray-500">
                Manage client records and rates.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              if (isFormVisible) {
                resetForm();
              } else {
                setIsFormVisible(true);
              }
            }}
            className="rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            {isFormVisible ? "Cancel" : "Add Client"}
          </Button>
        </div>
      </div>

      {isFormVisible && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-5 border-b pb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingClientId ? "Edit Client" : "Add New Client"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Rates Percentage
              </h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                <Input
                  value={marketingRate}
                  onChange={(e) => setMarketingRate(e.target.value)}
                  placeholder="Marketing %"
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
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl">
                {editingClientId ? "Update Client" : "Add Client"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Client List</h2>
            <p className="text-sm text-gray-500">
              Showing {paginatedClients.length} of {filteredClients.length}{" "}
              clients
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {[
                  "Client Name",
                  "Mobile",
                  "Email",
                  "City",
                  "Country",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-left font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y">
              {paginatedClients.length > 0 ? (
                paginatedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {client.name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {client.mobile || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {client.email || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {client.city || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {client.country || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedClient(client)}
                        className="rounded-xl"
                      >
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="rounded-xl"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="rounded-xl"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Client Details
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedClient.name || "-"}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedClient(null)}
                className="rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <DetailItem label="Client Name" value={selectedClient.name} />
                <DetailItem
                  label="Additional Info"
                  value={selectedClient.addtionalInfo}
                />
                <DetailItem label="Mobile" value={selectedClient.mobile} />
                <DetailItem label="Phone" value={selectedClient.phone} />
                <DetailItem label="Email" value={selectedClient.email} />
                <DetailItem label="Website" value={selectedClient.web} />
                <DetailItem label="Address" value={selectedClient.address} />
                <DetailItem label="City" value={selectedClient.city} />
                <DetailItem label="Zip Code" value={selectedClient.zipCode} />
                <DetailItem label="Country" value={selectedClient.country} />
                <DetailItem label="NTN" value={selectedClient.ntn} />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Rates
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <DetailItem
                    label="Marketing"
                    value={`${selectedClient.rates?.marketingServices ?? "-"}%`}
                  />
                  <DetailItem
                    label="Accommodation"
                    value={`${selectedClient.rates?.accommodation ?? "-"}%`}
                  />
                  <DetailItem
                    label="Travel"
                    value={`${selectedClient.rates?.travel ?? "-"}%`}
                  />
                  <DetailItem
                    label="Transport"
                    value={`${selectedClient.rates?.transport ?? "-"}%`}
                  />
                  <DetailItem
                    label="LTD / LSP"
                    value={`${selectedClient.rates?.ltdLsp ?? "-"}%`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedClient(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>

                <Button
                  onClick={() => handleEdit(selectedClient)}
                  className="rounded-xl"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Client
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
