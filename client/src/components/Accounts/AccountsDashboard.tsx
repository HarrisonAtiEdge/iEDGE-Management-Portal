// import { useEffect, useState } from "react"
// import { collection, getDocs } from "firebase/firestore"
// import { db } from "@/lib/firebase"

// import * as XLSX from "xlsx"
// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"

// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell
// } from "recharts"

// export default function AccountsDashboard() {

//   const [payments, setPayments] = useState<any[]>([])
//   const [invoices, setInvoices] = useState<any[]>([])

//   const [startDate,setStartDate] = useState("")
//   const [endDate,setEndDate] = useState("")

//   useEffect(() => {
//     fetchData()
//   }, [])

//   const fetchData = async () => {

//     const paySnap = await getDocs(
//       collection(db,"Panels","IEDGE-SYSTEM","payments")
//     )

//     const invSnap = await getDocs(
//       collection(db,"Panels","IEDGE-SYSTEM","estimateInvoices")
//     )

//     const payData:any[]=[]
//     const invData:any[]=[]

//     paySnap.forEach(doc=>{
//       payData.push({id:doc.id,...doc.data()})
//     })

//     invSnap.forEach(doc=>{
//       invData.push({id:doc.id,...doc.data()})
//     })

//     // latest first sorting
//     payData.sort(
//       (a,b)=> new Date(b.paymentDate).getTime() -
//               new Date(a.paymentDate).getTime()
//     )

//     setPayments(payData)
//     setInvoices(invData)
//   }

//   // DATE FILTER

//   const filteredPayments = payments.filter(p=>{

//     if(!startDate || !endDate) return true

//     const date = new Date(p.paymentDate)
//     return date >= new Date(startDate) && date <= new Date(endDate)

//   })

//   // ACCOUNT FILTERS

//   const iedgePayments = filteredPayments.filter(
//     p=>p.depositTo==="iedge"
//   )

//   const travelPayments = filteredPayments.filter(
//     p=>p.depositTo==="iedge-travel"
//   )

//   const iedgeTotal = iedgePayments.reduce(
//     (sum,p)=>sum + p.amount,0
//   )

//   const travelTotal = travelPayments.reduce(
//     (sum,p)=>sum + p.amount,0
//   )

//   const totalReceived = filteredPayments.reduce(
//     (sum,p)=>sum + p.amount,0
//   )

//   const totalInvoice = invoices.reduce(
//     (sum,i)=>sum + (i.total || 0),0
//   )

//   const totalPending = invoices.reduce(
//     (sum,i)=>sum + (i.balance ?? i.total),0
//   )

//   // GRAPH DATA

//   const barData = [
//     {
//       name:"iEDGE",
//       received:iedgeTotal
//     },
//     {
//       name:"Travel",
//       received:travelTotal
//     }
//   ]

//   const pieData = [
//     {name:"Received",value:totalReceived},
//     {name:"Pending",value:totalPending}
//   ]

//   const COLORS=["#4f46e5","#ef4444"]

//   // EXPORT EXCEL

//   const exportExcel = ()=>{

//     const worksheet = XLSX.utils.json_to_sheet(filteredPayments)

//     const workbook = XLSX.utils.book_new()

//     XLSX.utils.book_append_sheet(
//       workbook,
//       worksheet,
//       "Payments"
//     )

//     XLSX.writeFile(
//       workbook,
//       "Accounts_Report.xlsx"
//     )

//   }

//   // EXPORT PDF

//   const exportPDF = ()=>{

//     const doc = new jsPDF()

//     autoTable(doc,{
//       head:[[
//         "Date",
//         "Client",
//         "Method",
//         "Account",
//         "Reference",
//         "Amount"
//       ]],

//       body: filteredPayments.map(p=>[
//         p.paymentDate,
//         p.client,
//         p.method,
//         p.depositTo,
//         p.reference,
//         p.amount
//       ])
//     })

//     doc.save("Accounts_Report.pdf")
//   }

//   return(

//   <div className="p-8 bg-gray-50 min-h-screen">

//   <h1 className="text-2xl font-bold mb-6">
//   Accounts Dashboard
//   </h1>

// {/* DATE FILTER */}

// <div className="flex gap-4 mb-6">

// <input
// type="date"
// value={startDate}
// onChange={e=>setStartDate(e.target.value)}
// className="border p-2 rounded"
// />

// <input
// type="date"
// value={endDate}
// onChange={e=>setEndDate(e.target.value)}
// className="border p-2 rounded"
// />

// <button
// onClick={exportExcel}
// className="bg-green-600 text-white px-4 py-2 rounded"
// >
// Export Excel
// </button>

// <button
// onClick={exportPDF}
// className="bg-red-600 text-white px-4 py-2 rounded"
// >
// Export PDF
// </button>

// </div>

// {/* SUMMARY CARDS */}

// <div className="grid grid-cols-4 gap-4 mb-8">

// <div className="bg-white p-5 rounded shadow">
// <div className="text-gray-500 text-sm">
// Total Received
// </div>
// <div className="text-xl font-bold text-green-600">
// Rs {totalReceived}
// </div>
// </div>

// <div className="bg-white p-5 rounded shadow">
// <div className="text-gray-500 text-sm">
// Total Pending
// </div>
// <div className="text-xl font-bold text-red-500">
// Rs {totalPending}
// </div>
// </div>

// <div className="bg-white p-5 rounded shadow">
// <div className="text-gray-500 text-sm">
// iEDGE Total
// </div>
// <div className="text-xl font-bold text-blue-600">
// Rs {iedgeTotal}
// </div>
// </div>

// <div className="bg-white p-5 rounded shadow">
// <div className="text-gray-500 text-sm">
// Travel Total
// </div>
// <div className="text-xl font-bold text-purple-600">
// Rs {travelTotal}
// </div>
// </div>

// </div>

// {/* GRAPHS */}

// <div className="grid grid-cols-2 gap-8 mb-8">

// <div className="bg-white p-6 rounded shadow">

// <h2 className="font-semibold mb-4">
// Account Comparison
// </h2>

// <ResponsiveContainer width="100%" height={250}>

// <BarChart data={barData}>

// <XAxis dataKey="name"/>

// <YAxis/>

// <Tooltip/>

// <Bar dataKey="received"/>

// </BarChart>

// </ResponsiveContainer>

// </div>

// <div className="bg-white p-6 rounded shadow">

// <h2 className="font-semibold mb-4">
// Received vs Pending
// </h2>

// <ResponsiveContainer width="100%" height={250}>

// <PieChart>

// <Pie
// data={pieData}
// dataKey="value"
// outerRadius={100}
// label
// >

// {pieData.map((entry,index)=>(
// <Cell key={index} fill={COLORS[index]} />
// ))}

// </Pie>

// </PieChart>

// </ResponsiveContainer>

// </div>

// </div>

// {/* TRANSACTIONS */}

// <div className="bg-white p-6 rounded shadow">

// <h2 className="font-semibold mb-4">
// Latest Transactions
// </h2>

// <table className="w-full text-sm">

// <thead className="bg-gray-100">

// <tr>
// <th className="p-2 text-left">Date</th>
// <th className="p-2 text-left">Client</th>
// <th className="p-2 text-left">Method</th>
// <th className="p-2 text-left">Account</th>
// <th className="p-2 text-left">Reference</th>
// <th className="p-2 text-right">Amount</th>
// </tr>

// </thead>

// <tbody>

// {filteredPayments.map(p=>(

// <tr key={p.id} className="border-b">

// <td className="p-2">
// {p.paymentDate}
// </td>

// <td className="p-2">
// {p.client}
// </td>

// <td className="p-2">
// {p.method}
// </td>

// <td className="p-2">

// {p.depositTo==="iedge"
// ? "iEDGE"
// : "iEDGE Travel"}

// </td>

// <td className="p-2">
// {p.reference}
// </td>

// <td className="p-2 text-right font-semibold">
// Rs {p.amount}
// </td>

// </tr>

// ))}

// </tbody>

// </table>

// </div>

// </div>

// )

// }

// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// import {
//   createPaymentAccount,
//   fetchPaymentAccounts,
//   updatePaymentAccount,
// } from "@/lib/payments/paymentAccounts";
// import { PaymentAccount } from "@/lib/payments/types";
// import { useToast } from "@/hooks/use-toast";

// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

// export default function AccountsDashboard() {
//   const { toast } = useToast();

//   const [payments, setPayments] = useState<any[]>([]);
//   const [invoices, setInvoices] = useState<any[]>([]);
//   const [accounts, setAccounts] = useState<PaymentAccount[]>([]);

//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   const [createModalOpen, setCreateModalOpen] = useState(false);
//   const [listModalOpen, setListModalOpen] = useState(false);
//   const [accountLoading, setAccountLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     accountName: "",
//     accountNumber: "",
//     bankName: "",
//     iban: "",
//     branchName: "",
//     branchCode: "",
//     currency: "PKR",
//     openingBalance: "",
//     currentBalance: "",
//     notes: "",
//   });

//   useEffect(() => {
//     fetchData();
//     loadAccounts();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const paySnap = await getDocs(
//         collection(db, "Panels", "IEDGE-SYSTEM", "payments")
//       );

//       const invSnap = await getDocs(
//         collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices")
//       );

//       const payData: any[] = [];
//       const invData: any[] = [];

//       paySnap.forEach((doc) => {
//         payData.push({ id: doc.id, ...doc.data() });
//       });

//       invSnap.forEach((doc) => {
//         invData.push({ id: doc.id, ...doc.data() });
//       });

//       payData.sort(
//         (a, b) =>
//           new Date(b.paymentDate).getTime() -
//           new Date(a.paymentDate).getTime()
//       );

//       setPayments(payData);
//       setInvoices(invData);
//     } catch (error) {
//       console.error("Failed to load dashboard data:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load dashboard data",
//         variant: "destructive",
//       });
//     }
//   };

//   async function loadAccounts() {
//     try {
//       const rows = await fetchPaymentAccounts();
//       setAccounts(rows);
//     } catch (error) {
//       console.error("Failed to load payment accounts:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load payment accounts",
//         variant: "destructive",
//       });
//     }
//   }

//   async function handleCreateAccount(e: React.FormEvent) {
//     e.preventDefault();

//     if (!formData.accountName.trim()) {
//       toast({
//         title: "Error",
//         description: "Account name is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.accountNumber.trim()) {
//       toast({
//         title: "Error",
//         description: "Account number is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.bankName.trim()) {
//       toast({
//         title: "Error",
//         description: "Bank name is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setAccountLoading(true);

//       await createPaymentAccount({
//         accountName: formData.accountName,
//         accountNumber: formData.accountNumber,
//         bankName: formData.bankName,
//         iban: formData.iban,
//         branchName: formData.branchName,
//         branchCode: formData.branchCode,
//         currency: formData.currency || "PKR",
//         openingBalance: Number(formData.openingBalance || 0),
//         currentBalance: Number(
//           formData.currentBalance || formData.openingBalance || 0
//         ),
//         notes: formData.notes,
//         isActive: true,
//       });

//       toast({
//         title: "Success",
//         description: "Payment account created successfully",
//       });

//       setFormData({
//         accountName: "",
//         accountNumber: "",
//         bankName: "",
//         iban: "",
//         branchName: "",
//         branchCode: "",
//         currency: "PKR",
//         openingBalance: "",
//         currentBalance: "",
//         notes: "",
//       });

//       await loadAccounts();
//       setCreateModalOpen(false);
//     } catch (error: any) {
//       console.error("Failed to create payment account:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to create payment account",
//         variant: "destructive",
//       });
//     } finally {
//       setAccountLoading(false);
//     }
//   }

//   async function toggleAccountStatus(account: PaymentAccount) {
//     try {
//       await updatePaymentAccount(account.id, {
//         isActive: !(account.isActive !== false),
//       });

//       toast({
//         title: "Success",
//         description: "Account updated successfully",
//       });

//       await loadAccounts();
//     } catch (error: any) {
//       console.error("Failed to update account:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to update account",
//         variant: "destructive",
//       });
//     }
//   }

//   const filteredPayments = payments.filter((p) => {
//     if (!startDate || !endDate) return true;

//     const date = new Date(p.paymentDate);
//     return date >= new Date(startDate) && date <= new Date(endDate);
//   });

//   const iedgePayments = filteredPayments.filter((p) => p.depositTo === "iedge");
//   const travelPayments = filteredPayments.filter(
//     (p) => p.depositTo === "iedge-travel"
//   );

//   const iedgeTotal = iedgePayments.reduce(
//     (sum, p) => sum + Number(p.amount || 0),
//     0
//   );

//   const travelTotal = travelPayments.reduce(
//     (sum, p) => sum + Number(p.amount || 0),
//     0
//   );

//   const totalReceived = filteredPayments.reduce(
//     (sum, p) => sum + Number(p.amount || 0),
//     0
//   );

//   const totalPending = invoices.reduce(
//     (sum, i) => sum + Number(i.balance ?? i.total ?? 0),
//     0
//   );

//   const activeAccountsCount = useMemo(
//     () => accounts.filter((a) => a.isActive !== false).length,
//     [accounts]
//   );

//   const barData = [
//     { name: "iEDGE", received: iedgeTotal },
//     { name: "Travel", received: travelTotal },
//   ];

//   const pieData = [
//     { name: "Received", value: totalReceived },
//     { name: "Pending", value: totalPending },
//   ];

//   const COLORS = ["#4f46e5", "#ef4444"];

//   const exportExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(filteredPayments);
//     const workbook = XLSX.utils.book_new();

//     XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
//     XLSX.writeFile(workbook, "Accounts_Report.xlsx");
//   };

//   const exportPDF = () => {
//     const doc = new jsPDF();

//     autoTable(doc, {
//       head: [["Date", "Client", "Method", "Account", "Reference", "Amount"]],
//       body: filteredPayments.map((p) => [
//         p.paymentDate,
//         p.client,
//         p.method,
//         p.depositTo,
//         p.reference,
//         p.amount,
//       ]),
//     });

//     doc.save("Accounts_Report.pdf");
//   };

//   return (
//     <div className="p-8 bg-gray-50 min-h-screen">
//       <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
//         <h1 className="text-2xl font-bold">Accounts Dashboard</h1>

//         <div className="flex flex-wrap items-center gap-3">
//           <Dialog open={listModalOpen} onOpenChange={setListModalOpen}>
//             <DialogTrigger asChild>
//               <Button
//                 variant="outline"
//                 className="h-10 min-w-[140px] justify-center"
//               >
//                 Account List ({accounts.length})
//               </Button>
//             </DialogTrigger>

//             <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Payment Accounts</DialogTitle>
//               </DialogHeader>

//               <div className="space-y-4">
//                 {accounts.length === 0 ? (
//                   <div className="text-sm text-gray-500 border rounded-lg p-6 text-center">
//                     No accounts found.
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {accounts.map((account) => (
//                       <div
//                         key={account.id}
//                         className="border rounded-xl p-4 bg-white shadow-sm"
//                       >
//                         <div className="flex items-start justify-between gap-3 mb-3">
//                           <div>
//                             <h3 className="font-semibold text-base">
//                               {account.accountName || "-"}
//                             </h3>
//                             <p className="text-sm text-gray-500">
//                               {account.bankName || "-"}
//                             </p>
//                           </div>

//                           <span
//                             className={`text-xs px-2 py-1 rounded-full ${
//                               account.isActive !== false
//                                 ? "bg-green-100 text-green-700"
//                                 : "bg-red-100 text-red-700"
//                             }`}
//                           >
//                             {account.isActive !== false ? "Active" : "Inactive"}
//                           </span>
//                         </div>

//                         <div className="space-y-1 text-sm text-gray-700">
//                           <p>
//                             <span className="font-medium">Account No:</span>{" "}
//                             {account.accountNumber || "-"}
//                           </p>
//                           <p>
//                             <span className="font-medium">IBAN:</span>{" "}
//                             {account.iban || "-"}
//                           </p>
//                           <p>
//                             <span className="font-medium">Branch:</span>{" "}
//                             {account.branchName || "-"}
//                           </p>
//                           <p>
//                             <span className="font-medium">Branch Code:</span>{" "}
//                             {account.branchCode || "-"}
//                           </p>
//                           <p>
//                             <span className="font-medium">Currency:</span>{" "}
//                             {account.currency || "-"}
//                           </p>
//                           <p>
//                             <span className="font-medium">Opening Balance:</span>{" "}
//                             Rs {Number(account.openingBalance || 0).toLocaleString()}
//                           </p>
//                           <p>
//                             <span className="font-medium">Current Balance:</span>{" "}
//                             Rs {Number(account.currentBalance || 0).toLocaleString()}
//                           </p>
//                           {account.notes ? (
//                             <p>
//                               <span className="font-medium">Notes:</span>{" "}
//                               {account.notes}
//                             </p>
//                           ) : null}
//                         </div>

//                         <div className="mt-4">
//                           <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => toggleAccountStatus(account)}
//                           >
//                             {account.isActive !== false
//                               ? "Deactivate"
//                               : "Activate"}
//                           </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </DialogContent>
//           </Dialog>

//           <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
//             <DialogTrigger asChild>
//               <Button className="h-10 min-w-[140px] justify-center">
//                 Create Account
//               </Button>
//             </DialogTrigger>

//             <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
//               <DialogHeader>
//                 <DialogTitle>Create Payment Account</DialogTitle>
//               </DialogHeader>

//               <form
//                 onSubmit={handleCreateAccount}
//                 className="grid grid-cols-1 md:grid-cols-2 gap-4"
//               >
//                 <div>
//                   <Label>Account Name *</Label>
//                   <Input
//                     value={formData.accountName}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         accountName: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter account name"
//                   />
//                 </div>

//                 <div>
//                   <Label>Account Number *</Label>
//                   <Input
//                     value={formData.accountNumber}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         accountNumber: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter account number"
//                   />
//                 </div>

//                 <div>
//                   <Label>Bank Name *</Label>
//                   <Input
//                     value={formData.bankName}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         bankName: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter bank name"
//                   />
//                 </div>

//                 <div>
//                   <Label>IBAN</Label>
//                   <Input
//                     value={formData.iban}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         iban: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter IBAN"
//                   />
//                 </div>

//                 <div>
//                   <Label>Branch Name</Label>
//                   <Input
//                     value={formData.branchName}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         branchName: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter branch name"
//                   />
//                 </div>

//                 <div>
//                   <Label>Branch Code</Label>
//                   <Input
//                     value={formData.branchCode}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         branchCode: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter branch code"
//                   />
//                 </div>

//                 <div>
//                   <Label>Currency</Label>
//                   <Input
//                     value={formData.currency}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         currency: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter currency"
//                   />
//                 </div>

//                 <div>
//                   <Label>Opening Balance</Label>
//                   <Input
//                     type="number"
//                     value={formData.openingBalance}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         openingBalance: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter opening balance"
//                   />
//                 </div>

//                 <div>
//                   <Label>Current Balance</Label>
//                   <Input
//                     type="number"
//                     value={formData.currentBalance}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         currentBalance: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter current balance"
//                   />
//                 </div>

//                 <div className="md:col-span-2">
//                   <Label>Notes</Label>
//                   <Textarea
//                     value={formData.notes}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         notes: e.target.value,
//                       }))
//                     }
//                     placeholder="Enter notes"
//                   />
//                 </div>

//                 <div className="md:col-span-2 flex justify-end gap-3 pt-2">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => setCreateModalOpen(false)}
//                   >
//                     Cancel
//                   </Button>

//                   <Button type="submit" disabled={accountLoading}>
//                     {accountLoading ? "Saving..." : "Save Account"}
//                   </Button>
//                 </div>
//               </form>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       <div className="flex gap-4 mb-6 flex-wrap">
//         <Input
//           type="date"
//           value={startDate}
//           onChange={(e) => setStartDate(e.target.value)}
//           className="w-[180px]"
//         />

//         <Input
//           type="date"
//           value={endDate}
//           onChange={(e) => setEndDate(e.target.value)}
//           className="w-[180px]"
//         />

//         <Button
//           onClick={exportExcel}
//           className="bg-green-600 hover:bg-green-700 text-white"
//         >
//           Export Excel
//         </Button>

//         <Button
//           onClick={exportPDF}
//           className="bg-red-600 hover:bg-red-700 text-white"
//         >
//           Export PDF
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
//         <div className="bg-white p-5 rounded shadow">
//           <div className="text-gray-500 text-sm">Total Received</div>
//           <div className="text-xl font-bold text-green-600">
//             Rs {Number(totalReceived).toLocaleString()}
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded shadow">
//           <div className="text-gray-500 text-sm">Total Pending</div>
//           <div className="text-xl font-bold text-red-500">
//             Rs {Number(totalPending).toLocaleString()}
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded shadow">
//           <div className="text-gray-500 text-sm">iEDGE Total</div>
//           <div className="text-xl font-bold text-blue-600">
//             Rs {Number(iedgeTotal).toLocaleString()}
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded shadow">
//           <div className="text-gray-500 text-sm">Travel Total</div>
//           <div className="text-xl font-bold text-purple-600">
//             Rs {Number(travelTotal).toLocaleString()}
//           </div>
//         </div>

//         <div className="bg-white p-5 rounded shadow">
//           <div className="text-gray-500 text-sm">Active Accounts</div>
//           <div className="text-xl font-bold text-slate-700">
//             {activeAccountsCount}
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
//         <div className="bg-white p-6 rounded shadow">
//           <h2 className="font-semibold mb-4">Account Comparison</h2>

//           <ResponsiveContainer width="100%" height={250}>
//             <BarChart data={barData}>
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="received" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         <div className="bg-white p-6 rounded shadow">
//           <h2 className="font-semibold mb-4">Received vs Pending</h2>

//           <ResponsiveContainer width="100%" height={250}>
//             <PieChart>
//               <Pie data={pieData} dataKey="value" outerRadius={100} label>
//                 {pieData.map((entry, index) => (
//                   <Cell key={index} fill={COLORS[index]} />
//                 ))}
//               </Pie>
//             </PieChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       <div className="bg-white p-6 rounded shadow">
//         <h2 className="font-semibold mb-4">Latest Transactions</h2>

//         <div className="overflow-x-auto">
//           <table className="w-full text-sm min-w-[700px]">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-2 text-left">Date</th>
//                 <th className="p-2 text-left">Client</th>
//                 <th className="p-2 text-left">Method</th>
//                 <th className="p-2 text-left">Account</th>
//                 <th className="p-2 text-left">Reference</th>
//                 <th className="p-2 text-right">Amount</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredPayments.map((p) => (
//                 <tr key={p.id} className="border-b">
//                   <td className="p-2">{p.paymentDate}</td>
//                   <td className="p-2">{p.client}</td>
//                   <td className="p-2">{p.method}</td>
//                   <td className="p-2">
//                     {p.depositTo === "iedge"
//                       ? "iEDGE"
//                       : p.depositTo === "iedge-travel"
//                       ? "iEDGE Travel"
//                       : p.depositTo || "-"}
//                   </td>
//                   <td className="p-2">{p.reference}</td>
//                   <td className="p-2 text-right font-semibold">
//                     Rs {Number(p.amount || 0).toLocaleString()}
//                   </td>
//                 </tr>
//               ))}

//               {filteredPayments.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={6}
//                     className="p-6 text-center text-gray-500"
//                   >
//                     No transactions found.
//                   </td>
//                 </tr>
//               ) : null}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useEffect, useMemo, useState } from "react";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// import {
//   createPaymentAccount,
//   fetchPaymentAccounts,
//   updatePaymentAccount,
// } from "@/lib/payments/paymentAccounts";
// import { PaymentAccount } from "@/lib/payments/types";
// import { useToast } from "@/hooks/use-toast";

// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from "recharts";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

// type AccountFormData = {
//   accountName: string;
//   accountNumber: string;
//   bankName: string;
//   iban: string;
//   swiftCode: string;
//   branchName: string;
//   branchCode: string;
//   currency: string;
//   openingBalance: string;
//   notes: string;
// };

// const emptyForm: AccountFormData = {
//   accountName: "",
//   accountNumber: "",
//   bankName: "",
//   iban: "",
//   swiftCode: "",
//   branchName: "",
//   branchCode: "",
//   currency: "PKR",
//   openingBalance: "",
//   notes: "",
// };

// export default function AccountsDashboard() {
//   const { toast } = useToast();

//   const [payments, setPayments] = useState<any[]>([]);
//   const [invoices, setInvoices] = useState<any[]>([]);
//   const [accounts, setAccounts] = useState<PaymentAccount[]>([]);

//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   const [createModalOpen, setCreateModalOpen] = useState(false);
//   const [listModalOpen, setListModalOpen] = useState(false);
//   const [editModalOpen, setEditModalOpen] = useState(false);

//   const [accountLoading, setAccountLoading] = useState(false);
//   const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(
//     null,
//   );
//   const [formData, setFormData] = useState<AccountFormData>(emptyForm);

//   useEffect(() => {
//     fetchData();
//     loadAccounts();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const paySnap = await getDocs(
//         collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
//       );

//       const invSnap = await getDocs(
//         collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
//       );

//       const payData: any[] = [];
//       const invData: any[] = [];

//       paySnap.forEach((doc) => {
//         payData.push({ id: doc.id, ...doc.data() });
//       });

//       invSnap.forEach((doc) => {
//         invData.push({ id: doc.id, ...doc.data() });
//       });

//       payData.sort(
//         (a, b) =>
//           new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
//       );

//       setPayments(payData);
//       setInvoices(invData);
//     } catch (error) {
//       console.error("Failed to load dashboard data:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load dashboard data",
//         variant: "destructive",
//       });
//     }
//   };

//   async function loadAccounts() {
//     try {
//       const rows = await fetchPaymentAccounts();
//       setAccounts(rows);
//     } catch (error) {
//       console.error("Failed to load payment accounts:", error);
//       toast({
//         title: "Error",
//         description: "Failed to load payment accounts",
//         variant: "destructive",
//       });
//     }
//   }

//   function getAccountLabel(value: string) {
//     const found = accounts.find((account) => account.id === value);

//     if (found) {
//       return found.accountName || found.bankName || "Unnamed Account";
//     }

//     if (!value) return "-";

//     return value;
//   }

//   function openCreateModal() {
//     setEditingAccount(null);
//     setFormData(emptyForm);
//     setCreateModalOpen(true);
//   }

//   function openEditModal(account: PaymentAccount) {
//     setEditingAccount(account);
//     setFormData({
//       accountName: account.accountName || "",
//       accountNumber: account.accountNumber || "",
//       bankName: account.bankName || "",
//       iban: account.iban || "",
//       swiftCode: (account as any).swiftCode || "",
//       branchName: account.branchName || "",
//       branchCode: account.branchCode || "",
//       currency: account.currency || "PKR",
//       openingBalance: String(account.openingBalance ?? 0),
//       notes: account.notes || "",
//     });
//     setEditModalOpen(true);
//   }

//   function resetFormAndClose() {
//     setFormData(emptyForm);
//     setEditingAccount(null);
//     setCreateModalOpen(false);
//     setEditModalOpen(false);
//   }

//   async function handleCreateAccount(e: React.FormEvent) {
//     e.preventDefault();

//     if (!formData.accountName.trim()) {
//       toast({
//         title: "Error",
//         description: "Account name is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.accountNumber.trim()) {
//       toast({
//         title: "Error",
//         description: "Account number is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.bankName.trim()) {
//       toast({
//         title: "Error",
//         description: "Bank name is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setAccountLoading(true);

//       await createPaymentAccount({
//         accountName: formData.accountName,
//         accountNumber: formData.accountNumber,
//         bankName: formData.bankName,
//         iban: formData.iban,
//         swiftCode: formData.swiftCode,
//         branchName: formData.branchName,
//         branchCode: formData.branchCode,
//         currency: formData.currency || "PKR",
//         openingBalance: Number(formData.openingBalance || 0),
//         currentBalance: Number(formData.openingBalance || 0),
//         notes: formData.notes,
//         isActive: true,
//       } as any);

//       toast({
//         title: "Success",
//         description: "Payment account created successfully",
//       });

//       await loadAccounts();
//       resetFormAndClose();
//     } catch (error: any) {
//       console.error("Failed to create payment account:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to create payment account",
//         variant: "destructive",
//       });
//     } finally {
//       setAccountLoading(false);
//     }
//   }

//   async function handleEditAccount(e: React.FormEvent) {
//     e.preventDefault();

//     if (!editingAccount) return;

//     if (!formData.accountName.trim()) {
//       toast({
//         title: "Error",
//         description: "Account name is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.accountNumber.trim()) {
//       toast({
//         title: "Error",
//         description: "Account number is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!formData.bankName.trim()) {
//       toast({
//         title: "Error",
//         description: "Bank name is required",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       setAccountLoading(true);

//       await updatePaymentAccount(editingAccount.id, {
//         accountName: formData.accountName,
//         accountNumber: formData.accountNumber,
//         bankName: formData.bankName,
//         iban: formData.iban,
//         swiftCode: formData.swiftCode,
//         branchName: formData.branchName,
//         branchCode: formData.branchCode,
//         currency: formData.currency || "PKR",
//         openingBalance: Number(formData.openingBalance || 0),
//         notes: formData.notes,
//       } as any);

//       toast({
//         title: "Success",
//         description: "Account updated successfully",
//       });

//       await loadAccounts();
//       resetFormAndClose();
//     } catch (error: any) {
//       console.error("Failed to update account:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to update account",
//         variant: "destructive",
//       });
//     } finally {
//       setAccountLoading(false);
//     }
//   }

//   async function toggleAccountStatus(account: PaymentAccount) {
//     try {
//       await updatePaymentAccount(account.id, {
//         isActive: !(account.isActive !== false),
//       });

//       toast({
//         title: "Success",
//         description: "Account updated successfully",
//       });

//       await loadAccounts();
//     } catch (error: any) {
//       console.error("Failed to update account:", error);
//       toast({
//         title: "Error",
//         description: error?.message || "Failed to update account",
//         variant: "destructive",
//       });
//     }
//   }

//   const filteredPayments = payments.filter((p) => {
//     if (!startDate || !endDate) return true;

//     const date = new Date(p.paymentDate);
//     return date >= new Date(startDate) && date <= new Date(endDate);
//   });

//   const totalReceived = filteredPayments.reduce(
//     (sum, p) => sum + Number(p.amount || 0),
//     0,
//   );

//   const totalPending = invoices.reduce(
//     (sum, i) => sum + Number(i.balance ?? i.total ?? 0),
//     0,
//   );

//   const activeAccountsCount = useMemo(
//     () => accounts.filter((a) => a.isActive !== false).length,
//     [accounts],
//   );

//   const totalAccountsCount = accounts.length;

//   const dynamicBarData = useMemo(() => {
//     const grouped: Record<string, number> = {};

//     filteredPayments.forEach((payment) => {
//       const key = getAccountLabel(payment.depositTo);
//       grouped[key] = (grouped[key] || 0) + Number(payment.amount || 0);
//     });

//     return Object.entries(grouped)
//       .map(([name, received]) => ({ name, received }))
//       .sort((a, b) => b.received - a.received)
//       .slice(0, 6);
//   }, [filteredPayments, accounts]);

//   const pieData = [
//     { name: "Received", value: totalReceived },
//     { name: "Pending", value: totalPending },
//   ];

//   const COLORS = ["#0f172a", "#cbd5e1"];

//   const exportExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(
//       filteredPayments.map((p) => ({
//         ...p,
//         depositTo: getAccountLabel(p.depositTo),
//       })),
//     );

//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
//     XLSX.writeFile(workbook, "Accounts_Report.xlsx");
//   };

//   const exportPDF = () => {
//     const doc = new jsPDF();

//     autoTable(doc, {
//       head: [["Date", "Client", "Method", "Account", "Reference", "Amount"]],
//       body: filteredPayments.map((p) => [
//         p.paymentDate,
//         p.client,
//         p.method,
//         getAccountLabel(p.depositTo),
//         p.reference,
//         p.amount,
//       ]),
//     });

//     doc.save("Accounts_Report.pdf");
//   };

//   function renderAccountForm(
//     onSubmit: (e: React.FormEvent) => Promise<void>,
//     submitLabel: string,
//   ) {
//     return (
//       <form onSubmit={onSubmit} className="space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label>Account Name *</Label>
//             <Input
//               className="h-11 rounded-xl border-slate-200"
//               value={formData.accountName}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   accountName: e.target.value,
//                 }))
//               }
//               placeholder="Meezan PKR Collection"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label>Account Number *</Label>
//             <Input
//               className="h-11 rounded-xl border-slate-200"
//               value={formData.accountNumber}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   accountNumber: e.target.value,
//                 }))
//               }
//               placeholder="Enter account number"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label>Bank Name *</Label>
//             <Input
//               className="h-11 rounded-xl border-slate-200"
//               value={formData.bankName}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   bankName: e.target.value,
//                 }))
//               }
//               placeholder="Enter bank name"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label>Currency</Label>
//             <Input
//               className="h-11 rounded-xl border-slate-200"
//               value={formData.currency}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   currency: e.target.value,
//                 }))
//               }
//               placeholder="PKR"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label>IBAN</Label>
//             <Input
//               className="h-11 rounded-xl border-slate-200"
//               value={formData.iban}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   iban: e.target.value,
//                 }))
//               }
//               placeholder="Enter IBAN"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label>SWIFT Code</Label>
//             <Input
//               className="h-11 rounded-xl border-slate-200"
//               value={formData.swiftCode}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   swiftCode: e.target.value,
//                 }))
//               }
//               placeholder="Enter SWIFT code"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label>Branch Name</Label>
//             <Input
//               className="h-11 rounded-xl border-slate-200"
//               value={formData.branchName}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   branchName: e.target.value,
//                 }))
//               }
//               placeholder="Enter branch name"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label>Branch Code</Label>
//             <Input
//               className="h-11 rounded-xl border-slate-200"
//               value={formData.branchCode}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   branchCode: e.target.value,
//                 }))
//               }
//               placeholder="Enter branch code"
//             />
//           </div>

//           <div className="space-y-2 md:col-span-2">
//             <Label>Opening Balance</Label>
//             <Input
//               type="number"
//               className="h-11 rounded-xl border-slate-200"
//               value={formData.openingBalance}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   openingBalance: e.target.value,
//                 }))
//               }
//               placeholder="0"
//             />
//           </div>

//           <div className="space-y-2 md:col-span-2">
//             <Label>Notes</Label>
//             <Textarea
//               className="min-h-[110px] rounded-xl border-slate-200"
//               value={formData.notes}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   notes: e.target.value,
//                 }))
//               }
//               placeholder="Optional notes"
//             />
//           </div>
//         </div>

//         <div className="flex justify-end gap-3 pt-2">
//           <Button
//             type="button"
//             variant="outline"
//             className="rounded-xl border-slate-200"
//             onClick={resetFormAndClose}
//           >
//             Cancel
//           </Button>

//           <Button
//             type="submit"
//             disabled={accountLoading}
//             className="rounded-xl px-5"
//           >
//             {accountLoading ? "Saving..." : submitLabel}
//           </Button>
//         </div>
//       </form>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 p-6 md:p-8">
//       <div className="mx-auto space-y-8">
//         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//           <div>
//             <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
//               Accounts Dashboard
//             </h1>
//             <p className="mt-1 text-sm text-slate-500">
//               Manage payment accounts and review financial activity.
//             </p>
//           </div>

//           <div className="flex flex-wrap items-center justify-end gap-3">
//             <Dialog open={listModalOpen} onOpenChange={setListModalOpen}>
//               <DialogTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className="h-11 rounded-xl border-slate-200 bg-white px-5 shadow-sm hover:bg-slate-50"
//                 >
//                   Account List ({accounts.length})
//                 </Button>
//               </DialogTrigger>

//               <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto rounded-2xl border-0 p-0">
//                 <div className="border-b border-slate-200 px-6 py-5">
//                   <DialogHeader>
//                     <DialogTitle className="text-xl font-semibold text-slate-900">
//                       Saved Payment Accounts
//                     </DialogTitle>
//                   </DialogHeader>
//                 </div>

//                 <div className="px-6 py-6">
//                   {accounts.length === 0 ? (
//                     <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
//                       No payment accounts found.
//                     </div>
//                   ) : (
//                     <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//                       {accounts.map((account) => (
//                         <div
//                           key={account.id}
//                           className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
//                         >
//                           <div className="mb-4 flex items-start justify-between gap-3">
//                             <div className="min-w-0">
//                               <h3 className="truncate text-base font-semibold text-slate-900">
//                                 {account.accountName || "-"}
//                               </h3>
//                               <p className="truncate text-sm text-slate-500">
//                                 {account.bankName || "-"}
//                               </p>
//                             </div>

//                             <span
//                               className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
//                                 account.isActive !== false
//                                   ? "bg-emerald-50 text-emerald-700"
//                                   : "bg-rose-50 text-rose-700"
//                               }`}
//                             >
//                               {account.isActive !== false
//                                 ? "Active"
//                                 : "Inactive"}
//                             </span>
//                           </div>

//                           <div className="space-y-2 text-sm text-slate-600">
//                             <div className="flex justify-between gap-3">
//                               <span className="text-slate-400">Account No</span>
//                               <span className="text-right font-medium">
//                                 {account.accountNumber || "-"}
//                               </span>
//                             </div>

//                             <div className="flex justify-between gap-3">
//                               <span className="text-slate-400">IBAN</span>
//                               <span className="text-right font-medium">
//                                 {account.iban || "-"}
//                               </span>
//                             </div>

//                             <div className="flex justify-between gap-3">
//                               <span className="text-slate-400">SWIFT</span>
//                               <span className="text-right font-medium">
//                                 {(account as any).swiftCode || "-"}
//                               </span>
//                             </div>

//                             <div className="flex justify-between gap-3">
//                               <span className="text-slate-400">Branch</span>
//                               <span className="text-right font-medium">
//                                 {account.branchName || "-"}
//                               </span>
//                             </div>

//                             <div className="flex justify-between gap-3">
//                               <span className="text-slate-400">Currency</span>
//                               <span className="text-right font-medium">
//                                 {account.currency || "PKR"}
//                               </span>
//                             </div>

//                             <div className="flex justify-between gap-3">
//                               <span className="text-slate-400">
//                                 Opening Balance
//                               </span>
//                               <span className="text-right font-semibold text-slate-900">
//                                 Rs{" "}
//                                 {Number(
//                                   account.openingBalance || 0,
//                                 ).toLocaleString()}
//                               </span>
//                             </div>

//                             <div className="flex justify-between gap-3">
//                               <span className="text-slate-400">
//                                 Current Balance
//                               </span>
//                               <span className="text-right font-semibold text-slate-900">
//                                 Rs{" "}
//                                 {Number(
//                                   (account as any).currentBalance ??
//                                     (account as any).balance ??
//                                     0,
//                                 ).toLocaleString()}
//                               </span>
//                             </div>
//                           </div>

//                           {account.notes ? (
//                             <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
//                               {account.notes}
//                             </div>
//                           ) : null}

//                           <div className="mt-5 flex items-center gap-2">
//                             <Button
//                               type="button"
//                               variant="outline"
//                               className="flex-1 rounded-xl border-slate-200"
//                               onClick={() => openEditModal(account)}
//                             >
//                               Edit
//                             </Button>

//                             <Button
//                               type="button"
//                               variant="outline"
//                               className="flex-1 rounded-xl border-slate-200"
//                               onClick={() => toggleAccountStatus(account)}
//                             >
//                               {account.isActive !== false
//                                 ? "Deactivate"
//                                 : "Activate"}
//                             </Button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </DialogContent>
//             </Dialog>

//             <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
//               <DialogTrigger asChild>
//                 <Button
//                   onClick={openCreateModal}
//                   className="h-11 rounded-xl px-5 shadow-sm"
//                 >
//                   Create Account
//                 </Button>
//               </DialogTrigger>

//               <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border-0 p-0">
//                 <div className="border-b border-slate-200 px-6 py-5">
//                   <DialogHeader>
//                     <DialogTitle className="text-xl font-semibold text-slate-900">
//                       Create Payment Account
//                     </DialogTitle>
//                   </DialogHeader>
//                 </div>

//                 <div className="px-6 py-6">
//                   {renderAccountForm(handleCreateAccount, "Save Account")}
//                 </div>
//               </DialogContent>
//             </Dialog>

//             <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
//               <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border-0 p-0">
//                 <div className="border-b border-slate-200 px-6 py-5">
//                   <DialogHeader>
//                     <DialogTitle className="text-xl font-semibold text-slate-900">
//                       Edit Payment Account
//                     </DialogTitle>
//                   </DialogHeader>
//                 </div>

//                 <div className="px-6 py-6">
//                   {renderAccountForm(handleEditAccount, "Update Account")}
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>
//         </div>

//         <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//           <div className="flex flex-wrap items-center gap-3">
//             <Input
//               type="date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className="h-11 w-[180px] rounded-xl border-slate-200"
//             />

//             <Input
//               type="date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className="h-11 w-[180px] rounded-xl border-slate-200"
//             />

//             <Button
//               onClick={exportExcel}
//               variant="outline"
//               className="h-11 rounded-xl border-slate-200 bg-white"
//             >
//               Export Excel
//             </Button>

//             <Button
//               onClick={exportPDF}
//               variant="outline"
//               className="h-11 rounded-xl border-slate-200 bg-white"
//             >
//               Export PDF
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//           <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="text-sm text-slate-500">Total Received</div>
//             <div className="mt-2 text-2xl font-semibold text-slate-900">
//               Rs {Number(totalReceived).toLocaleString()}
//             </div>
//           </div>

//           <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="text-sm text-slate-500">Total Pending</div>
//             <div className="mt-2 text-2xl font-semibold text-slate-900">
//               Rs {Number(totalPending).toLocaleString()}
//             </div>
//           </div>

//           <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="text-sm text-slate-500">Total Accounts</div>
//             <div className="mt-2 text-2xl font-semibold text-slate-900">
//               {totalAccountsCount}
//             </div>
//           </div>

//           <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="text-sm text-slate-500">Active Accounts</div>
//             <div className="mt-2 text-2xl font-semibold text-slate-900">
//               {activeAccountsCount}
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
//           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//             <h2 className="mb-4 text-base font-semibold text-slate-900">
//               Account-wise Collections
//             </h2>

//             <ResponsiveContainer width="100%" height={280}>
//               <BarChart data={dynamicBarData}>
//                 <XAxis dataKey="name" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="received" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//             <h2 className="mb-4 text-base font-semibold text-slate-900">
//               Received vs Pending
//             </h2>

//             <ResponsiveContainer width="100%" height={280}>
//               <PieChart>
//                 <Pie data={pieData} dataKey="value" outerRadius={105} label>
//                   {pieData.map((entry, index) => (
//                     <Cell key={index} fill={COLORS[index]} />
//                   ))}
//                 </Pie>
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//           <div className="mb-4 flex items-center justify-between">
//             <h2 className="text-base font-semibold text-slate-900">
//               Latest Transactions
//             </h2>
//             <span className="text-sm text-slate-500">
//               {filteredPayments.length} record(s)
//             </span>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="min-w-[760px] w-full text-sm">
//               <thead>
//                 <tr className="border-b border-slate-200 text-slate-500">
//                   <th className="px-3 py-3 text-left font-medium">Date</th>
//                   <th className="px-3 py-3 text-left font-medium">Client</th>
//                   <th className="px-3 py-3 text-left font-medium">Method</th>
//                   <th className="px-3 py-3 text-left font-medium">Account</th>
//                   <th className="px-3 py-3 text-left font-medium">Reference</th>
//                   <th className="px-3 py-3 text-right font-medium">Amount</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredPayments.length > 0 ? (
//                   filteredPayments.map((p) => (
//                     <tr key={p.id} className="border-b border-slate-100">
//                       <td className="px-3 py-3 text-slate-700">
//                         {p.paymentDate}
//                       </td>
//                       <td className="px-3 py-3 text-slate-700">{p.client}</td>
//                       <td className="px-3 py-3 text-slate-700">{p.method}</td>
//                       <td className="px-3 py-3 text-slate-700">
//                         {getAccountLabel(p.depositTo)}
//                       </td>
//                       <td className="px-3 py-3 text-slate-700">
//                         {p.reference}
//                       </td>
//                       <td className="px-3 py-3 text-right font-semibold text-slate-900">
//                         Rs {Number(p.amount || 0).toLocaleString()}
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan={6}
//                       className="px-3 py-10 text-center text-sm text-slate-500"
//                     >
//                       No transactions found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }






import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import {
  createPaymentAccount,
  fetchPaymentAccounts,
  updatePaymentAccount,
} from "@/lib/payments/paymentAccounts";
import { PaymentAccount } from "@/lib/payments/types";
import { useToast } from "@/hooks/use-toast";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AccountFormData = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  iban: string;
  swiftCode: string;
  branchName: string;
  branchCode: string;
  currency: string;
  openingBalance: string;
  notes: string;
};

const emptyForm: AccountFormData = {
  accountName: "",
  accountNumber: "",
  bankName: "",
  iban: "",
  swiftCode: "",
  branchName: "",
  branchCode: "",
  currency: "PKR",
  openingBalance: "",
  notes: "",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const COLORS = ["#2563eb", "#cbd5e1"];

export default function AccountsDashboard() {
  const { toast } = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [accountLoading, setAccountLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(
    null,
  );
  const [formData, setFormData] = useState<AccountFormData>(emptyForm);

  useEffect(() => {
    fetchData();
    loadAccounts();
  }, []);

  const fetchData = async () => {
    try {
      const paySnap = await getDocs(
        collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
      );

      const invSnap = await getDocs(
        collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
      );

      const payData: any[] = [];
      const invData: any[] = [];

      paySnap.forEach((doc) => {
        payData.push({ id: doc.id, ...doc.data() });
      });

      invSnap.forEach((doc) => {
        invData.push({ id: doc.id, ...doc.data() });
      });

      payData.sort(
        (a, b) =>
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
      );

      setPayments(payData);
      setInvoices(invData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  async function loadAccounts() {
    try {
      const rows = await fetchPaymentAccounts();
      setAccounts(rows);
    } catch (error) {
      console.error("Failed to load payment accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load payment accounts",
        variant: "destructive",
      });
    }
  }

  function formatCurrency(value: number | string | undefined | null) {
    return `Rs ${Number(value || 0).toLocaleString()}`;
  }

  function getAccountLabel(value: string) {
    const found = accounts.find((account) => account.id === value);

    if (found) {
      return found.accountName || found.bankName || "Unnamed Account";
    }

    if (!value) return "-";

    return value;
  }

  function openCreateModal() {
    setEditingAccount(null);
    setFormData(emptyForm);
    setCreateModalOpen(true);
  }

  function openEditModal(account: PaymentAccount) {
    setEditingAccount(account);
    setFormData({
      accountName: account.accountName || "",
      accountNumber: account.accountNumber || "",
      bankName: account.bankName || "",
      iban: account.iban || "",
      swiftCode: (account as any).swiftCode || "",
      branchName: account.branchName || "",
      branchCode: account.branchCode || "",
      currency: account.currency || "PKR",
      openingBalance: String(account.openingBalance ?? 0),
      notes: account.notes || "",
    });
    setEditModalOpen(true);
  }

  function resetFormAndClose() {
    setFormData(emptyForm);
    setEditingAccount(null);
    setCreateModalOpen(false);
    setEditModalOpen(false);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.accountName.trim()) {
      toast({
        title: "Error",
        description: "Account name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.accountNumber.trim()) {
      toast({
        title: "Error",
        description: "Account number is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bankName.trim()) {
      toast({
        title: "Error",
        description: "Bank name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setAccountLoading(true);

      await createPaymentAccount({
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        iban: formData.iban,
        swiftCode: formData.swiftCode,
        branchName: formData.branchName,
        branchCode: formData.branchCode,
        currency: formData.currency || "PKR",
        openingBalance: Number(formData.openingBalance || 0),
        currentBalance: Number(formData.openingBalance || 0),
        notes: formData.notes,
        isActive: true,
      } as any);

      toast({
        title: "Success",
        description: "Payment account created successfully",
      });

      await loadAccounts();
      resetFormAndClose();
    } catch (error: any) {
      console.error("Failed to create payment account:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create payment account",
        variant: "destructive",
      });
    } finally {
      setAccountLoading(false);
    }
  }

  async function handleEditAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!editingAccount) return;

    if (!formData.accountName.trim()) {
      toast({
        title: "Error",
        description: "Account name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.accountNumber.trim()) {
      toast({
        title: "Error",
        description: "Account number is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bankName.trim()) {
      toast({
        title: "Error",
        description: "Bank name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setAccountLoading(true);

      await updatePaymentAccount(editingAccount.id, {
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        iban: formData.iban,
        swiftCode: formData.swiftCode,
        branchName: formData.branchName,
        branchCode: formData.branchCode,
        currency: formData.currency || "PKR",
        openingBalance: Number(formData.openingBalance || 0),
        notes: formData.notes,
      } as any);

      toast({
        title: "Success",
        description: "Account updated successfully",
      });

      await loadAccounts();
      resetFormAndClose();
    } catch (error: any) {
      console.error("Failed to update account:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update account",
        variant: "destructive",
      });
    } finally {
      setAccountLoading(false);
    }
  }

  async function toggleAccountStatus(account: PaymentAccount) {
    try {
      await updatePaymentAccount(account.id, {
        isActive: !(account.isActive !== false),
      });

      toast({
        title: "Success",
        description: "Account updated successfully",
      });

      await loadAccounts();
    } catch (error: any) {
      console.error("Failed to update account:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update account",
        variant: "destructive",
      });
    }
  }

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (!startDate && !endDate) return true;

      const date = new Date(p.paymentDate);
      if (Number.isNaN(date.getTime())) return true;

      if (startDate) {
        const start = new Date(startDate);
        if (date < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (date > end) return false;
      }

      return true;
    });
  }, [payments, startDate, endDate]);

  const totalReceived = useMemo(() => {
    return filteredPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
  }, [filteredPayments]);

  const totalPending = useMemo(() => {
    return invoices.reduce((sum, i) => sum + Number(i.balance ?? i.total ?? 0), 0);
  }, [invoices]);

  const activeAccountsCount = useMemo(
    () => accounts.filter((a) => a.isActive !== false).length,
    [accounts],
  );

  const totalAccountsCount = accounts.length;

  const dynamicBarData = useMemo(() => {
    const grouped: Record<string, number> = {};

    filteredPayments.forEach((payment) => {
      const key = getAccountLabel(payment.depositTo);
      grouped[key] = (grouped[key] || 0) + Number(payment.amount || 0);
    });

    return Object.entries(grouped)
      .map(([name, received]) => ({ name, received }))
      .sort((a, b) => b.received - a.received)
      .slice(0, 6);
  }, [filteredPayments, accounts]);

  const pieData = useMemo(
    () => [
      { name: "Received", value: totalReceived },
      { name: "Pending", value: totalPending },
    ],
    [totalReceived, totalPending],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / rowsPerPage),
  );

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPayments.slice(start, start + rowsPerPage);
  }, [filteredPayments, currentPage, rowsPerPage]);

  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      Math.min(currentPage - 2, totalPages - maxVisiblePages + 1),
    );
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index,
    );
  }, [currentPage, totalPages]);

  const firstRecord =
    filteredPayments.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const lastRecord = Math.min(currentPage * rowsPerPage, filteredPayments.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayments.map((p) => ({
        ...p,
        depositTo: getAccountLabel(p.depositTo),
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "Accounts_Report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [["Date", "Client", "Method", "Account", "Reference", "Amount"]],
      body: filteredPayments.map((p) => [
        p.paymentDate,
        p.client,
        p.method,
        getAccountLabel(p.depositTo),
        p.reference,
        p.amount,
      ]),
    });

    doc.save("Accounts_Report.pdf");
  };

  function renderAccountForm(
    onSubmit: (e: React.FormEvent) => Promise<void>,
    submitLabel: string,
  ) {
    return (
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Account Name *
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.accountName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  accountName: e.target.value,
                }))
              }
              placeholder="Meezan PKR Collection"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Account Number *
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  accountNumber: e.target.value,
                }))
              }
              placeholder="Enter account number"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Bank Name *
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.bankName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  bankName: e.target.value,
                }))
              }
              placeholder="Enter bank name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Currency
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.currency}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currency: e.target.value,
                }))
              }
              placeholder="PKR"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              IBAN
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.iban}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  iban: e.target.value,
                }))
              }
              placeholder="Enter IBAN"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              SWIFT Code
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.swiftCode}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  swiftCode: e.target.value,
                }))
              }
              placeholder="Enter SWIFT code"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Branch Name
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.branchName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  branchName: e.target.value,
                }))
              }
              placeholder="Enter branch name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Branch Code
            </Label>
            <Input
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.branchCode}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  branchCode: e.target.value,
                }))
              }
              placeholder="Enter branch code"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Opening Balance
            </Label>
            <Input
              type="number"
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.openingBalance}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  openingBalance: e.target.value,
                }))
              }
              placeholder="0"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Notes
            </Label>
            <Textarea
              className="min-h-[110px] rounded-2xl border-slate-200 bg-slate-50/80 shadow-none focus-visible:ring-blue-100"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Optional notes"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 bg-white px-5"
            onClick={resetFormAndClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={accountLoading}
            className="h-11 rounded-2xl bg-slate-950 px-6 text-white shadow-sm hover:bg-slate-800"
          >
            {accountLoading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    );
  }

  const summaryCards = [
    {
      title: "Total Received",
      value: formatCurrency(totalReceived),
      subtitle: "Filtered collection amount",
    },
    {
      title: "Total Pending",
      value: formatCurrency(totalPending),
      subtitle: "Open invoice balance",
    },
    {
      title: "Total Accounts",
      value: totalAccountsCount,
      subtitle: "Saved payment accounts",
    },
    {
      title: "Active Accounts",
      value: activeAccountsCount,
      subtitle: "Ready for deposits",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] px-4 py-6 text-slate-900 md:px-8 md:py-8">
      <div className="mx-auto  space-y-7">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-blue-100 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-emerald-100 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                Finance Overview
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
                Accounts Dashboard
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 md:text-base">
                Manage payment accounts, monitor collections, review pending
                balances, and export filtered reports from one clean workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Dialog open={listModalOpen} onOpenChange={setListModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-200 bg-white px-5 shadow-sm hover:bg-slate-50"
                  >
                    Account List ({accounts.length})
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-h-[85vh] max-w-6xl overflow-y-auto rounded-[1.75rem] border-0 p-0 shadow-2xl">
                  <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                        Saved Payment Accounts
                      </DialogTitle>
                    </DialogHeader>
                    <p className="mt-1 text-sm text-slate-500">
                      Review account details, status, and balance information.
                    </p>
                  </div>

                  <div className="px-6 py-6">
                    {accounts.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                        No payment accounts found.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {accounts.map((account) => (
                          <div
                            key={account.id}
                            className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-xl"
                          >
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-base font-bold text-slate-950">
                                  {account.accountName || "-"}
                                </h3>
                                <p className="truncate text-sm text-slate-500">
                                  {account.bankName || "-"}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  account.isActive !== false
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {account.isActive !== false ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <div className="space-y-2 rounded-2xl bg-slate-50/80 p-4 text-sm text-slate-600">
                              <div className="flex justify-between gap-3">
                                <span className="text-slate-400">Account No</span>
                                <span className="text-right font-medium text-slate-700">
                                  {account.accountNumber || "-"}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="text-slate-400">IBAN</span>
                                <span className="text-right font-medium text-slate-700">
                                  {account.iban || "-"}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="text-slate-400">SWIFT</span>
                                <span className="text-right font-medium text-slate-700">
                                  {(account as any).swiftCode || "-"}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="text-slate-400">Branch</span>
                                <span className="text-right font-medium text-slate-700">
                                  {account.branchName || "-"}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="text-slate-400">Currency</span>
                                <span className="text-right font-medium text-slate-700">
                                  {account.currency || "PKR"}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3 border-t border-slate-200/70 pt-2">
                                <span className="text-slate-400">Opening Balance</span>
                                <span className="text-right font-bold text-slate-950">
                                  {formatCurrency(account.openingBalance || 0)}
                                </span>
                              </div>

                              <div className="flex justify-between gap-3">
                                <span className="text-slate-400">Current Balance</span>
                                <span className="text-right font-bold text-slate-950">
                                  {formatCurrency(
                                    (account as any).currentBalance ??
                                      (account as any).balance ??
                                      0,
                                  )}
                                </span>
                              </div>
                            </div>

                            {account.notes ? (
                              <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3 text-sm leading-6 text-slate-600">
                                {account.notes}
                              </div>
                            ) : null}

                            <div className="mt-5 flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 flex-1 rounded-2xl border-slate-200 bg-white"
                                onClick={() => openEditModal(account)}
                              >
                                Edit
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 flex-1 rounded-2xl border-slate-200 bg-white"
                                onClick={() => toggleAccountStatus(account)}
                              >
                                {account.isActive !== false ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openCreateModal}
                    className="h-11 rounded-2xl bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
                  >
                    Create Account
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto rounded-[1.75rem] border-0 p-0 shadow-2xl">
                  <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                        Create Payment Account
                      </DialogTitle>
                    </DialogHeader>
                    <p className="mt-1 text-sm text-slate-500">
                      Add bank or collection account information.
                    </p>
                  </div>

                  <div className="px-6 py-6">
                    {renderAccountForm(handleCreateAccount, "Save Account")}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto rounded-[1.75rem] border-0 p-0 shadow-2xl">
                  <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                        Edit Payment Account
                      </DialogTitle>
                    </DialogHeader>
                    <p className="mt-1 text-sm text-slate-500">
                      Update payment account information.
                    </p>
                  </div>

                  <div className="px-6 py-6">
                    {renderAccountForm(handleEditAccount, "Update Account")}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >

              <div className="mt-5 text-sm font-medium text-slate-500">
                {card.title}
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {card.value}
              </div>
              <div className="mt-1 text-xs text-slate-400">{card.subtitle}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[1.75rem] border border-white bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Filters</h2>
              <p className="mt-1 text-sm text-slate-500">
                Filter transactions by payment date and export the current result.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="grid gap-1">
                <Label className="text-xs font-medium text-slate-500">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50/80 shadow-none md:w-[180px]"
                />
              </div>

              <div className="grid gap-1">
                <Label className="text-xs font-medium text-slate-500">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 w-full rounded-2xl border-slate-200 bg-slate-50/80 shadow-none md:w-[180px]"
                />
              </div>

              <div className="flex items-end gap-3 pt-5">
                <Button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  variant="outline"
                  className="h-11 rounded-2xl border-slate-200 bg-white px-4"
                >
                  Clear
                </Button>

                <Button
                  onClick={exportExcel}
                  variant="outline"
                  className="h-11 rounded-2xl border-slate-200 bg-white px-4"
                >
                  Export Excel
                </Button>

                <Button
                  onClick={exportPDF}
                  variant="outline"
                  className="h-11 rounded-2xl border-slate-200 bg-white px-4"
                >
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Account-wise Collections
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Top accounts by received amount.
                </p>
              </div>
            </div>

            {dynamicBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dynamicBarData}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Bar dataKey="received" radius={[10, 10, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                No collection data available.
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Received vs Pending
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Current collection and outstanding balance split.
                </p>
              </div>
            </div>

            {totalReceived > 0 || totalPending > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={108}
                    innerRadius={62}
                    paddingAngle={4}
                    label={({ name }) => name}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                No payment summary available.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-white px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Latest Transactions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {firstRecord} to {lastRecord} of {filteredPayments.length} records
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-slate-500">Rows</Label>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Method</th>
                  <th className="px-6 py-4 font-semibold">Account</th>
                  <th className="px-6 py-4 font-semibold">Reference</th>
                  <th className="px-6 py-4 text-right font-semibold">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedPayments.length > 0 ? (
                  paginatedPayments.map((p) => (
                    <tr key={p.id} className="transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">
                        {p.paymentDate || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="font-semibold text-slate-800">
                          {p.client || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {p.method || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {getAccountLabel(p.depositTo)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {p.reference || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-black text-slate-950">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <div className="mx-auto max-w-sm rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8">
                        <div className="text-sm font-semibold text-slate-700">
                          No transactions found
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Try changing or clearing the selected date filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="h-10 rounded-2xl border-slate-200 bg-white px-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </Button>

              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  type="button"
                  variant={page === currentPage ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 min-w-10 rounded-2xl px-3 ${
                    page === currentPage
                      ? "bg-slate-950 text-white hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </Button>
              ))}

              <Button
                type="button"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="h-10 rounded-2xl border-slate-200 bg-white px-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}