// import React, { useEffect, useMemo, useState } from "react";
// import {
//     collection,
//     addDoc,
//     onSnapshot,
//     orderBy,
//     query,
//     serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/contexts/AuthContext";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";

// const PANEL_ID = "IEDGE-SYSTEM";

// type ClientItem = {
//     id: string;
//     name: string;
// };

// type ContactPersonItem = {
//     id: string;
//     title: string;
//     fullName: string;
//     mobileNumber: string;
//     company: string;
//     email: string;
//     designation: string;
//     createdByName?: string;
// };

// interface ContactPersonsPageProps {
//     clients?: ClientItem[];
// }

// export default function ContactPersonsPage({
//     clients = [],
// }: ContactPersonsPageProps) {
//     const { userProfile } = useAuth();
//     const { toast } = useToast();

//     const [saving, setSaving] = useState(false);
//     const [records, setRecords] = useState<ContactPersonItem[]>([]);

//     const [formData, setFormData] = useState({
//         title: "",
//         fullName: "",
//         mobileNumber: "",
//         client: "",
//         email: "",
//         designation: "",
//     });

//     useEffect(() => {
//         const q = query(
//             collection(db, "Panels", PANEL_ID, "contact-persons"),
//             orderBy("fullName", "asc")
//         );

//         const unsubscribe = onSnapshot(
//             q,
//             (snapshot) => {
//                 const list: ContactPersonItem[] = snapshot.docs.map((docSnap) => {
//                     const data = docSnap.data() as any;
//                     return {
//                         id: docSnap.id,
//                         title: data.title || "",
//                         fullName: data.fullName || "",
//                         mobileNumber: data.mobileNumber || "",
//                         company: data.company || "",
//                         email: data.email || "",
//                         designation: data.designation || "",
//                         createdByName: data.createdByName || "",
//                     };
//                 });
//                 setRecords(list);
//             },
//             (error) => {
//                 console.error("Error fetching contact persons:", error);
//                 toast({
//                     title: "Error",
//                     description: "Failed to load contact persons.",
//                     variant: "destructive",
//                 });
//             }
//         );

//         return () => unsubscribe();
//     }, [toast]);

//     const resetForm = () => {
//         setFormData({
//             title: "",
//             fullName: "",
//             mobileNumber: "",
//             client: "",
//             email: "",
//             designation: "",
//         });
//     };

//     const handleSave = async (e: React.FormEvent) => {
//         e.preventDefault();

//         if (!userProfile) {
//             toast({
//                 title: "Error",
//                 description: "User not authenticated.",
//                 variant: "destructive",
//             });
//             return;
//         }

//         if (
//             !formData.title ||
//             !formData.fullName.trim() ||
//             !formData.mobileNumber.trim() ||
//             !formData.client
//         ) {
//             toast({
//                 title: "Missing required fields",
//                 description: "Please fill Title, Full Name, Mobile Number and Company.",
//                 variant: "destructive",
//             });
//             return;
//         }

//         try {
//             setSaving(true);

//             await addDoc(collection(db, "Panels", "IEDGE-SYSTEM", "contact-persons"), {
//                 title: formData.title,
//                 fullName: formData.fullName.trim(),
//                 mobileNumber: formData.mobileNumber.trim(),
//                 client: formData.client,
//                 email: formData.email.trim(),
//                 designation: formData.designation.trim(),
//                 createdAt: serverTimestamp(),
//                 updatedAt: serverTimestamp(),
//                 createdById: userProfile.id,
//                 createdByName: userProfile.displayName || "Unknown User",
//             });

//             toast({
//                 title: "Success",
//                 description: "Contact person added successfully.",
//             });

//             resetForm();
//         } catch (error) {
//             console.error("Error saving contact person:", error);
//             toast({
//                 title: "Error",
//                 description: "Failed to save contact person.",
//                 variant: "destructive",
//             });
//         } finally {
//             setSaving(false);
//         }
//     };

//     const sortedClients = useMemo(() => {
//         return [...clients].sort((a, b) => a.name.localeCompare(b.name));
//     }, [clients]);

//     return (
//         <div className="p-6 space-y-6">
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Contact Person</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <Label>Title *</Label>
//                             <Select
//                                 value={formData.title}
//                                 onValueChange={(value) =>
//                                     setFormData((prev) => ({ ...prev, title: value }))
//                                 }
//                             >
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Select Title" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="Mr">Mr</SelectItem>
//                                     <SelectItem value="Mrs">Mrs</SelectItem>
//                                     <SelectItem value="Miss">Miss</SelectItem>
//                                     <SelectItem value="Dr">Dr</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         <div>
//                             <Label>Full Name *</Label>
//                             <Input
//                                 value={formData.fullName}
//                                 onChange={(e) =>
//                                     setFormData((prev) => ({ ...prev, fullName: e.target.value }))
//                                 }
//                                 placeholder="Enter full name"
//                             />
//                         </div>

//                         <div>
//                             <Label>Mobile Number *</Label>
//                             <Input
//                                 value={formData.mobileNumber}
//                                 onChange={(e) =>
//                                     setFormData((prev) => ({
//                                         ...prev,
//                                         mobileNumber: e.target.value,
//                                     }))
//                                 }
//                                 placeholder="+92 300 1234567"
//                             />
//                         </div>
//                         <div>
//                             <Label>Client *</Label>
//                             <Select
//                                 value={formData.client}
//                                 onValueChange={(value) =>
//                                     setFormData((prev) => ({ ...prev, client: value }))
//                                 }
//                             >
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Select Client" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     {clients.map((client) => (
//                                         <SelectItem key={client.id} value={client.name}>
//                                             {client.name}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                         </div>

//                         <div>
//                             <Label>Email ID</Label>
//                             <Input
//                                 type="email"
//                                 value={formData.email}
//                                 onChange={(e) =>
//                                     setFormData((prev) => ({ ...prev, email: e.target.value }))
//                                 }
//                                 placeholder="Enter email"
//                             />
//                         </div>

//                         <div>
//                             <Label>Designation</Label>
//                             <Input
//                                 value={formData.designation}
//                                 onChange={(e) =>
//                                     setFormData((prev) => ({
//                                         ...prev,
//                                         designation: e.target.value,
//                                     }))
//                                 }
//                                 placeholder="Enter designation"
//                             />
//                         </div>

//                         <div className="md:col-span-2 flex gap-3 pt-2">
//                             <Button type="submit" disabled={saving}>
//                                 {saving ? "Saving..." : "Save Contact Person"}
//                             </Button>
//                             <Button type="button" variant="outline" onClick={resetForm}>
//                                 Reset
//                             </Button>
//                         </div>
//                     </form>
//                 </CardContent>
//             </Card>

//             <Card>
//                 <CardHeader>
//                     <CardTitle>Saved Contact Persons</CardTitle>
//                 </CardHeader>
//                 <CardContent className="overflow-x-auto">
//                     <Table>
//                         <TableHeader>
//                             <TableRow>
//                                 <TableHead>Title</TableHead>
//                                 <TableHead>Full Name</TableHead>
//                                 <TableHead>Mobile Number</TableHead>
//                                 <TableHead>Company</TableHead>
//                                 <TableHead>Email</TableHead>
//                                 <TableHead>Designation</TableHead>
//                             </TableRow>
//                         </TableHeader>
//                         <TableBody>
//                             {records.length > 0 ? (
//                                 records.map((item) => (
//                                     <TableRow key={item.id}>
//                                         <TableCell>{item.title}</TableCell>
//                                         <TableCell>{item.fullName}</TableCell>
//                                         <TableCell>{item.mobileNumber}</TableCell>
//                                         <TableCell>{item.company}</TableCell>
//                                         <TableCell>{item.email || "-"}</TableCell>
//                                         <TableCell>{item.designation || "-"}</TableCell>
//                                     </TableRow>
//                                 ))
//                             ) : (
//                                 <TableRow>
//                                     <TableCell colSpan={6} className="text-center text-muted-foreground">
//                                         No contact persons found.
//                                     </TableCell>
//                                 </TableRow>
//                             )}
//                         </TableBody>
//                     </Table>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }






import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PANEL_ID = "IEDGE-SYSTEM";

type ClientItem = {
  id: string;
  name: string;
};

type ContactPersonItem = {
  id: string;
  title: string;
  fullName: string;
  mobileNumber: string;
  client: string;
  email: string;
  designation: string;
  createdByName?: string;
};

export default function ContactPersonsPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<ContactPersonItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    fullName: "",
    mobileNumber: "",
    client: "",
    email: "",
    designation: "",
  });

  useEffect(() => {
    const q = query(
      collection(db, "Panels", PANEL_ID, "clients"),
      orderBy("name", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ClientItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            name: data.name || "",
          };
        });
        setClients(list);
      },
      (error) => {
        console.error("Error fetching clients:", error);
        toast({
          title: "Error",
          description: "Failed to load clients.",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    const q = query(
      collection(db, "Panels", PANEL_ID, "contact-persons"),
      orderBy("fullName", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ContactPersonItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            title: data.title || "",
            fullName: data.fullName || "",
            mobileNumber: data.mobileNumber || "",
            client: data.client || "",
            email: data.email || "",
            designation: data.designation || "",
            createdByName: data.createdByName || "",
          };
        });
        setRecords(list);
      },
      (error) => {
        console.error("Error fetching contact persons:", error);
        toast({
          title: "Error",
          description: "Failed to load contact persons.",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const resetForm = () => {
    setFormData({
      title: "",
      fullName: "",
      mobileNumber: "",
      client: "",
      email: "",
      designation: "",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userProfile) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.title ||
      !formData.fullName.trim() ||
      !formData.mobileNumber.trim() ||
      !formData.client
    ) {
      toast({
        title: "Missing required fields",
        description: "Please fill Title, Full Name, Mobile Number and Client.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "Panels", PANEL_ID, "contact-persons"), {
        title: formData.title,
        fullName: formData.fullName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        client: formData.client,
        email: formData.email.trim(),
        designation: formData.designation.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdById: userProfile.id,
        createdByName: userProfile.displayName || "Unknown User",
      });

      toast({
        title: "Success",
        description: "Contact person added successfully.",
      });

      resetForm();
    } catch (error) {
      console.error("Error saving contact person:", error);
      toast({
        title: "Error",
        description: "Failed to save contact person.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Person</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title *</Label>
              <Select
                value={formData.title}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, title: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr">Mr</SelectItem>
                  <SelectItem value="Mrs">Mrs</SelectItem>
                  <SelectItem value="Miss">Miss</SelectItem>
                  <SelectItem value="Dr">Dr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Enter full name"
              />
            </div>

            <div>
              <Label>Mobile Number *</Label>
              <Input
                value={formData.mobileNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mobileNumber: e.target.value,
                  }))
                }
                placeholder="+92 300 1234567"
              />
            </div>

            <div>
              <Label>Client *</Label>
              <Select
                value={formData.client}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, client: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  {sortedClients.map((client) => (
                    <SelectItem key={client.id} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Email ID</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter email"
              />
            </div>

            <div>
              <Label>Designation</Label>
              <Input
                value={formData.designation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    designation: e.target.value,
                  }))
                }
                placeholder="Enter designation"
              />
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Contact Person"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Contact Persons</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Designation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length > 0 ? (
                records.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.fullName}</TableCell>
                    <TableCell>{item.mobileNumber}</TableCell>
                    <TableCell>{item.client}</TableCell>
                    <TableCell>{item.email || "-"}</TableCell>
                    <TableCell>{item.designation || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No contact persons found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}