// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs, Timestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// type RecordItem = {
//   category?: string;
//   amount?: number;
//   name?: string;
//   description?: string;
// };

// type FirestoreRecordData = {
//   firebasePath?: string;

//   accountId?: string;
//   accountType?: "cheque" | "online";
//   accountTitle?: string;
//   accountNo?: string;
//   bank?: string;
//   branch?: string;
//   city?: string;
//   platform?: string;
//   routingNumber?: string;

//   chequeAmount?: number;
//   totalItemAmount?: number;
//   remainingBalance?: number;

//   items?: RecordItem[];

//   createdBy?: string;
//   createdByName?: string;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
//   status?: string;
// };

// type RecordRow = FirestoreRecordData & {
//   id: string;
// };

// const RECORD_COLLECTION_PATH = ["Panels", "IEDGE-SYSTEM", "Record"] as const;

// export default function RecordList() {
//   const [records, setRecords] = useState<RecordRow[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [searchText, setSearchText] = useState<string>("");
//   const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

//   const formatAmount = (value?: number): string => {
//     return Number(value || 0).toLocaleString("en-US", {
//       maximumFractionDigits: 2,
//     });
//   };

//   const formatDate = (timestamp?: Timestamp): string => {
//     if (!timestamp) return "-";

//     try {
//       return timestamp.toDate().toLocaleString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "2-digit",
//         hour: "2-digit",
//         minute: "2-digit",
//       });
//     } catch {
//       return "-";
//     }
//   };

//   const fetchRecords = async () => {
//     try {
//       setLoading(true);

//       const snapshot = await getDocs(collection(db, ...RECORD_COLLECTION_PATH));

//       const recordList: RecordRow[] = snapshot.docs.map((doc) => {
//         const data = doc.data() as FirestoreRecordData;

//         return {
//           id: doc.id,
//           ...data,
//           items: Array.isArray(data.items) ? data.items : [],
//         };
//       });

//       recordList.sort((a, b) => {
//         const aTime = a.createdAt?.toDate?.().getTime?.() || 0;
//         const bTime = b.createdAt?.toDate?.().getTime?.() || 0;
//         return bTime - aTime;
//       });

//       setRecords(recordList);
//     } catch (error) {
//       console.error("Failed to fetch records:", error);
//       setRecords([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRecords();
//   }, []);

//   const filteredRecords = useMemo(() => {
//     const query = searchText.trim().toLowerCase();

//     if (!query) return records;

//     return records.filter((record) => {
//       const searchableText = [
//         record.accountTitle,
//         record.accountNo,
//         record.bank,
//         record.accountType,
//         record.createdByName,
//         record.status,
//         ...(record.items || []).flatMap((item) => [
//           item.category,
//           item.name,
//           item.description,
//         ]),
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return searchableText.includes(query);
//     });
//   }, [records, searchText]);

//   const summary = useMemo(() => {
//     return filteredRecords.reduce(
//       (total, record) => {
//         total.chequeAmount += Number(record.chequeAmount || 0);
//         total.totalItemAmount += Number(record.totalItemAmount || 0);
//         total.remainingBalance += Number(record.remainingBalance || 0);
//         return total;
//       },
//       {
//         chequeAmount: 0,
//         totalItemAmount: 0,
//         remainingBalance: 0,
//       }
//     );
//   }, [filteredRecords]);

//   const toggleExpand = (recordId: string) => {
//     setExpandedRecordId((currentId) =>
//       currentId === recordId ? null : recordId
//     );
//   };

//   return (
//     <div className="mx-auto max-w-7xl">
//       <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
//         <div>
//           <h2
//             className="mb-2 text-3xl font-bold text-foreground"
//             data-testid="text-record-list-title"
//           >
//             Record List
//           </h2>

//           <p className="text-muted-foreground">
//             View all records saved in Firebase under Panels / IEDGE-SYSTEM /
//             Record.
//           </p>
//         </div>

//         <Button
//           type="button"
//           variant="outline"
//           onClick={fetchRecords}
//           disabled={loading}
//           data-testid="button-refresh-records"
//         >
//           {loading ? "Refreshing..." : "Refresh"}
//         </Button>
//       </div>

//       <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
//         <Card>
//           <CardContent className="p-5">
//             <p className="text-sm text-muted-foreground">Total Cheque Amount</p>
//             <h3 className="mt-2 text-2xl font-bold">
//               {formatAmount(summary.chequeAmount)}
//             </h3>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-5">
//             <p className="text-sm text-muted-foreground">Total Item Amount</p>
//             <h3 className="mt-2 text-2xl font-bold">
//               {formatAmount(summary.totalItemAmount)}
//             </h3>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-5">
//             <p className="text-sm text-muted-foreground">
//               Total Remaining Balance
//             </p>
//             <h3 className="mt-2 text-2xl font-bold">
//               {formatAmount(summary.remainingBalance)}
//             </h3>
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader>
//           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//             <CardTitle>All Records</CardTitle>

//             <div className="w-full md:w-80">
//               <Input
//                 value={searchText}
//                 onChange={(e) => setSearchText(e.target.value)}
//                 placeholder="Search records..."
//                 data-testid="input-search-records"
//               />
//             </div>
//           </div>
//         </CardHeader>

//         <CardContent>
//           {loading ? (
//             <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/30">
//               <p className="text-muted-foreground">Loading records...</p>
//             </div>
//           ) : filteredRecords.length === 0 ? (
//             <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/30">
//               <p className="text-muted-foreground">No records found.</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {filteredRecords.map((record) => {
//                 const isExpanded = expandedRecordId === record.id;

//                 return (
//                   <div
//                     key={record.id}
//                     className="overflow-hidden rounded-xl border bg-background"
//                   >
//                     <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:items-center">
//                       <div className="md:col-span-3">
//                         <p className="text-xs text-muted-foreground">
//                           Account
//                         </p>
//                         <p className="font-semibold text-foreground">
//                           {record.accountTitle || "-"}
//                         </p>
//                         <p className="text-sm text-muted-foreground">
//                           {record.bank || "-"} / {record.accountNo || "-"}
//                         </p>
//                       </div>

//                       <div className="md:col-span-2">
//                         <p className="text-xs text-muted-foreground">Type</p>
//                         <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize">
//                           {record.accountType || "-"}
//                         </span>
//                       </div>

//                       <div className="md:col-span-2">
//                         <p className="text-xs text-muted-foreground">
//                           Cheque Amount
//                         </p>
//                         <p className="font-semibold">
//                           {formatAmount(record.chequeAmount)}
//                         </p>
//                       </div>

//                       <div className="md:col-span-2">
//                         <p className="text-xs text-muted-foreground">
//                           Item Amount
//                         </p>
//                         <p className="font-semibold">
//                           {formatAmount(record.totalItemAmount)}
//                         </p>
//                       </div>

//                       <div className="md:col-span-2">
//                         <p className="text-xs text-muted-foreground">
//                           Remaining
//                         </p>
//                         <p
//                           className={`font-semibold ${
//                             Number(record.remainingBalance || 0) < 0
//                               ? "text-red-600"
//                               : "text-emerald-600"
//                           }`}
//                         >
//                           {formatAmount(record.remainingBalance)}
//                         </p>
//                       </div>

//                       <div className="md:col-span-1 md:text-right">
//                         <Button
//                           type="button"
//                           variant="outline"
//                           size="sm"
//                           onClick={() => toggleExpand(record.id)}
//                           data-testid={`button-view-record-${record.id}`}
//                         >
//                           {isExpanded ? "Hide" : "View"}
//                         </Button>
//                       </div>
//                     </div>

//                     {isExpanded && (
//                       <div className="border-t bg-muted/20 p-4">
//                         <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
//                           <div>
//                             <p className="text-xs text-muted-foreground">
//                               Created By
//                             </p>
//                             <p className="font-medium">
//                               {record.createdByName || "Unknown User"}
//                             </p>
//                           </div>

//                           <div>
//                             <p className="text-xs text-muted-foreground">
//                               Created At
//                             </p>
//                             <p className="font-medium">
//                               {formatDate(record.createdAt)}
//                             </p>
//                           </div>

//                           <div>
//                             <p className="text-xs text-muted-foreground">
//                               Status
//                             </p>
//                             <p className="font-medium capitalize">
//                               {record.status || "-"}
//                             </p>
//                           </div>

//                           <div>
//                             <p className="text-xs text-muted-foreground">
//                               Record ID
//                             </p>
//                             <p className="break-all font-medium">
//                               {record.id}
//                             </p>
//                           </div>
//                         </div>

//                         <div className="mb-5 rounded-xl border bg-background p-4">
//                           <h4 className="mb-3 font-semibold">
//                             Account Details
//                           </h4>

//                           <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
//                             <div>
//                               <p className="text-muted-foreground">
//                                 Account Title
//                               </p>
//                               <p className="font-medium">
//                                 {record.accountTitle || "-"}
//                               </p>
//                             </div>

//                             <div>
//                               <p className="text-muted-foreground">Bank</p>
//                               <p className="font-medium">
//                                 {record.bank || "-"}
//                               </p>
//                             </div>

//                             <div>
//                               <p className="text-muted-foreground">
//                                 Account No
//                               </p>
//                               <p className="font-medium">
//                                 {record.accountNo || "-"}
//                               </p>
//                             </div>

//                             {record.accountType === "cheque" && (
//                               <>
//                                 <div>
//                                   <p className="text-muted-foreground">
//                                     Branch
//                                   </p>
//                                   <p className="font-medium">
//                                     {record.branch || "-"}
//                                   </p>
//                                 </div>

//                                 <div>
//                                   <p className="text-muted-foreground">City</p>
//                                   <p className="font-medium">
//                                     {record.city || "-"}
//                                   </p>
//                                 </div>
//                               </>
//                             )}

//                             {record.accountType === "online" && (
//                               <>
//                                 <div>
//                                   <p className="text-muted-foreground">
//                                     Platform
//                                   </p>
//                                   <p className="font-medium">
//                                     {record.platform || "-"}
//                                   </p>
//                                 </div>

//                                 <div>
//                                   <p className="text-muted-foreground">
//                                     Routing Number
//                                   </p>
//                                   <p className="font-medium">
//                                     {record.routingNumber || "-"}
//                                   </p>
//                                 </div>
//                               </>
//                             )}
//                           </div>
//                         </div>

//                         <div className="rounded-xl border bg-background">
//                           <div className="border-b p-4">
//                             <h4 className="font-semibold">Record Items</h4>
//                           </div>

//                           <div className="overflow-x-auto">
//                             <table className="w-full min-w-[760px] text-left text-sm">
//                               <thead className="bg-muted/50">
//                                 <tr>
//                                   <th className="px-4 py-3 font-semibold">
//                                     #
//                                   </th>
//                                   <th className="px-4 py-3 font-semibold">
//                                     Category
//                                   </th>
//                                   <th className="px-4 py-3 font-semibold">
//                                     Name
//                                   </th>
//                                   <th className="px-4 py-3 font-semibold">
//                                     Description
//                                   </th>
//                                   <th className="px-4 py-3 text-right font-semibold">
//                                     Amount
//                                   </th>
//                                 </tr>
//                               </thead>

//                               <tbody>
//                                 {(record.items || []).map((item, index) => (
//                                   <tr key={index} className="border-t">
//                                     <td className="px-4 py-3">{index + 1}</td>
//                                     <td className="px-4 py-3">
//                                       {item.category || "-"}
//                                     </td>
//                                     <td className="px-4 py-3">
//                                       {item.name || "-"}
//                                     </td>
//                                     <td className="px-4 py-3">
//                                       {item.description || "-"}
//                                     </td>
//                                     <td className="px-4 py-3 text-right font-semibold">
//                                       {formatAmount(item.amount)}
//                                     </td>
//                                   </tr>
//                                 ))}

//                                 {(record.items || []).length === 0 && (
//                                   <tr>
//                                     <td
//                                       colSpan={5}
//                                       className="px-4 py-6 text-center text-muted-foreground"
//                                     >
//                                       No items found.
//                                     </td>
//                                   </tr>
//                                 )}
//                               </tbody>
//                             </table>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }





import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RecordItem = {
  category?: string;
  amount?: number;
  name?: string;
  description?: string;
};

type FirestoreRecordData = {
  firebasePath?: string;

  accountId?: string;
  accountType?: "cheque" | "online";
  accountTitle?: string;
  accountNo?: string;
  bank?: string;
  branch?: string;
  city?: string;
  platform?: string;
  routingNumber?: string;

  chequeNumber?: string;
  chequeAmount?: number;
  totalItemAmount?: number;
  remainingBalance?: number;

  items?: RecordItem[];

  createdBy?: string;
  createdByName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  status?: string;
};

type RecordRow = FirestoreRecordData & {
  id: string;
};

const RECORD_COLLECTION_PATH = ["Panels", "IEDGE-SYSTEM", "Record"] as const;

export default function RecordList() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>("");
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const formatAmount = (value?: number): string => {
    return Number(value || 0).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (timestamp?: Timestamp): string => {
    if (!timestamp) return "-";

    try {
      return timestamp.toDate().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, ...RECORD_COLLECTION_PATH));

      const recordList: RecordRow[] = snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreRecordData;

        return {
          id: doc.id,
          ...data,
          items: Array.isArray(data.items) ? data.items : [],
        };
      });

      recordList.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.().getTime?.() || 0;
        const bTime = b.createdAt?.toDate?.().getTime?.() || 0;
        return bTime - aTime;
      });

      setRecords(recordList);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return records;

    return records.filter((record) => {
      const searchableText = [
        record.accountTitle,
        record.accountNo,
        record.bank,
        record.chequeNumber,
        record.accountType,
        record.createdByName,
        record.status,
        ...(record.items || []).flatMap((item) => [
          item.category,
          item.name,
          item.description,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [records, searchText]);

  const summary = useMemo(() => {
    return filteredRecords.reduce(
      (total, record) => {
        total.chequeAmount += Number(record.chequeAmount || 0);
        total.totalItemAmount += Number(record.totalItemAmount || 0);
        total.remainingBalance += Number(record.remainingBalance || 0);
        return total;
      },
      {
        chequeAmount: 0,
        totalItemAmount: 0,
        remainingBalance: 0,
      }
    );
  }, [filteredRecords]);

  const toggleExpand = (recordId: string) => {
    setExpandedRecordId((currentId) =>
      currentId === recordId ? null : recordId
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2
            className="mb-2 text-3xl font-bold text-foreground"
            data-testid="text-record-list-title"
          >
            Record List
          </h2>

          <p className="text-muted-foreground">
            View all records saved in Firebase under Panels / IEDGE-SYSTEM /
            Record.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={fetchRecords}
          disabled={loading}
          data-testid="button-refresh-records"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Cheque Amount</p>
            <h3 className="mt-2 text-2xl font-bold">
              {formatAmount(summary.chequeAmount)}
            </h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Item Amount</p>
            <h3 className="mt-2 text-2xl font-bold">
              {formatAmount(summary.totalItemAmount)}
            </h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Total Remaining Balance
            </p>
            <h3 className="mt-2 text-2xl font-bold">
              {formatAmount(summary.remainingBalance)}
            </h3>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Records</CardTitle>

            <div className="w-full md:w-80">
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by account, cheque number, bank, item..."
                data-testid="input-search-records"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/30">
              <p className="text-muted-foreground">Loading records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center rounded-xl border bg-muted/30">
              <p className="text-muted-foreground">No records found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => {
                const isExpanded = expandedRecordId === record.id;

                return (
                  <div
                    key={record.id}
                    className="overflow-hidden rounded-xl border bg-background"
                  >
                    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-12 md:items-center">
                      <div className="md:col-span-3">
                        <p className="text-xs text-muted-foreground">
                          Account
                        </p>
                        <p className="font-semibold text-foreground">
                          {record.accountTitle || "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.bank || "-"} / {record.accountNo || "-"}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Cheque Number
                        </p>
                        <p className="font-semibold">
                          {record.chequeNumber || "-"}
                        </p>
                      </div>

                      <div className="md:col-span-1">
                        <p className="text-xs text-muted-foreground">Type</p>
                        <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize">
                          {record.accountType || "-"}
                        </span>
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Cheque Amount
                        </p>
                        <p className="font-semibold">
                          {formatAmount(record.chequeAmount)}
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground">
                          Item Amount
                        </p>
                        <p className="font-semibold">
                          {formatAmount(record.totalItemAmount)}
                        </p>
                      </div>

                      <div className="md:col-span-1">
                        <p className="text-xs text-muted-foreground">
                          Remaining
                        </p>
                        <p
                          className={`font-semibold ${
                            Number(record.remainingBalance || 0) < 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {formatAmount(record.remainingBalance)}
                        </p>
                      </div>

                      <div className="md:col-span-1 md:text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpand(record.id)}
                          data-testid={`button-view-record-${record.id}`}
                        >
                          {isExpanded ? "Hide" : "View"}
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-muted/20 p-4">
                        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Created By
                            </p>
                            <p className="font-medium">
                              {record.createdByName || "Unknown User"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Created At
                            </p>
                            <p className="font-medium">
                              {formatDate(record.createdAt)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Status
                            </p>
                            <p className="font-medium capitalize">
                              {record.status || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Record ID
                            </p>
                            <p className="break-all font-medium">
                              {record.id}
                            </p>
                          </div>
                        </div>

                        <div className="mb-5 rounded-xl border bg-background p-4">
                          <h4 className="mb-3 font-semibold">
                            Account Details
                          </h4>

                          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
                            <div>
                              <p className="text-muted-foreground">
                                Account Title
                              </p>
                              <p className="font-medium">
                                {record.accountTitle || "-"}
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">Bank</p>
                              <p className="font-medium">
                                {record.bank || "-"}
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">
                                Account No
                              </p>
                              <p className="font-medium">
                                {record.accountNo || "-"}
                              </p>
                            </div>

                            <div>
                              <p className="text-muted-foreground">
                                Cheque Number
                              </p>
                              <p className="font-medium">
                                {record.chequeNumber || "-"}
                              </p>
                            </div>

                            {record.accountType === "cheque" && (
                              <>
                                <div>
                                  <p className="text-muted-foreground">
                                    Branch
                                  </p>
                                  <p className="font-medium">
                                    {record.branch || "-"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-muted-foreground">City</p>
                                  <p className="font-medium">
                                    {record.city || "-"}
                                  </p>
                                </div>
                              </>
                            )}

                            {record.accountType === "online" && (
                              <>
                                <div>
                                  <p className="text-muted-foreground">
                                    Platform
                                  </p>
                                  <p className="font-medium">
                                    {record.platform || "-"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-muted-foreground">
                                    Routing Number
                                  </p>
                                  <p className="font-medium">
                                    {record.routingNumber || "-"}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl border bg-background">
                          <div className="border-b p-4">
                            <h4 className="font-semibold">Record Items</h4>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="px-4 py-3 font-semibold">
                                    #
                                  </th>
                                  <th className="px-4 py-3 font-semibold">
                                    Category
                                  </th>
                                  <th className="px-4 py-3 font-semibold">
                                    Name
                                  </th>
                                  <th className="px-4 py-3 font-semibold">
                                    Description
                                  </th>
                                  <th className="px-4 py-3 text-right font-semibold">
                                    Amount
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {(record.items || []).map((item, index) => (
                                  <tr key={index} className="border-t">
                                    <td className="px-4 py-3">{index + 1}</td>
                                    <td className="px-4 py-3">
                                      {item.category || "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                      {item.name || "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                      {item.description || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold">
                                      {formatAmount(item.amount)}
                                    </td>
                                  </tr>
                                ))}

                                {(record.items || []).length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="px-4 py-6 text-center text-muted-foreground"
                                    >
                                      No items found.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}