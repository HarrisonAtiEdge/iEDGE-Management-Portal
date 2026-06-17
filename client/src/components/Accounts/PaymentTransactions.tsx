// import { useEffect, useState } from "react"
// import { collection, getDocs } from "firebase/firestore"
// import { db } from "@/lib/firebase"

// import * as XLSX from "xlsx"
// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"

// import {
// Select,
// SelectContent,
// SelectItem,
// SelectTrigger,
// SelectValue
// } from "@/components/ui/select"


// interface Payment {

// id:string
// paymentDate:string
// invoiceNo:string
// client:string
// method:string
// reference:string
// amount:number
// invoiceTotal:number
// balanceAfter:number
// depositTo:string

// }

// export default function PaymentTransactions(){

// const [payments,setPayments] = useState<Payment[]>([])
// const [selectedAccount,setSelectedAccount] = useState("iedge")

// const [clientFilter,setClientFilter] = useState("")
// const [invoiceFilter,setInvoiceFilter] = useState("")

// const [dateRange,setDateRange] = useState("all")

// const [page,setPage] = useState(1)
// const [perPage,setPerPage] = useState(10)

// useEffect(()=>{
// fetchPayments()
// },[])


// const fetchPayments = async()=>{

// const paymentSnap = await getDocs(
// collection(db,"Panels","IEDGE-SYSTEM","payments")
// )

// const invoiceSnap = await getDocs(
// collection(db,"Panels","IEDGE-SYSTEM","estimateInvoices")
// )

// const invoiceMap:any = {}

// invoiceSnap.forEach(doc=>{
// invoiceMap[doc.id] = doc.data()
// })

// const data:Payment[] = []

// paymentSnap.forEach(doc=>{

// const p:any = doc.data()
// const invoice = invoiceMap[p.invoiceId]

// data.push({

// id:doc.id,
// paymentDate:p.paymentDate,
// client:p.client,
// method:p.method,
// reference:p.reference,
// amount:Number(p.amount || 0),

// invoiceNo:p.invoiceNo || invoice?.invoiceNo || "-",
// invoiceTotal:invoice?.total ?? 0,

// balanceAfter:
// p.balanceAfter ??
// invoice?.balance ??
// invoice?.total ??
// 0,

// depositTo:p.depositTo

// })

// })

// setPayments(data)

// }






// /* DATE RANGE */

// const getDateRange = ()=>{

// const now = new Date()

// if(dateRange==="today"){

// return new Date(
// now.getFullYear(),
// now.getMonth(),
// now.getDate()
// )

// }

// if(dateRange==="thisMonth"){

// return new Date(
// now.getFullYear(),
// now.getMonth(),
// 1
// )

// }

// if(dateRange==="lastMonth"){

// return new Date(
// now.getFullYear(),
// now.getMonth()-1,
// 1
// )

// }

// return null

// }

// const rangeDate = getDateRange()



// /* FILTER */

// let filteredPayments = payments.filter(p=>{

// if(p.depositTo !== selectedAccount) return false

// if(
// clientFilter &&
// !p.client?.toLowerCase().includes(clientFilter.toLowerCase())
// ) return false

// if(
// invoiceFilter &&
// !p.invoiceNo?.toLowerCase().includes(invoiceFilter.toLowerCase())
// ) return false


// if(rangeDate){

// if(new Date(p.paymentDate) < rangeDate)
// return false

// }

// return true

// })


// /* SORT LATEST FIRST */

// filteredPayments = filteredPayments.sort((a,b)=>{

// return new Date(b.paymentDate).getTime() -
// new Date(a.paymentDate).getTime()

// })



// /* TOTAL */

// const totalReceived = filteredPayments.reduce(
// (sum,p)=> sum + Number(p.amount || 0),
// 0
// )



// /* PAGINATION */

// const totalPages = Math.ceil(filteredPayments.length/perPage)

// const paginated = filteredPayments.slice(
// (page-1)*perPage,
// page*perPage
// )




// /* EXPORT EXCEL */

// const exportExcel = ()=>{

// const worksheet = XLSX.utils.json_to_sheet(filteredPayments)

// const workbook = XLSX.utils.book_new()

// XLSX.utils.book_append_sheet(
// workbook,
// worksheet,
// "Ledger"
// )

// XLSX.writeFile(workbook,"ledger.xlsx")

// }



// /* EXPORT PDF */

// const exportPDF = ()=>{

// const doc = new jsPDF()

// autoTable(doc,{

// head:[[
// "Date",
// "Invoice",
// "Client",
// "Method",
// "Reference",
// "Invoice Total",
// "Amount",
// "Pending"
// ]],

// body:filteredPayments.map(p=>[
// p.paymentDate,
// p.invoiceNo,
// p.client,
// p.method,
// p.reference,
// p.invoiceTotal,
// p.amount,
// p.balanceAfter
// ])

// })

// doc.save("ledger.pdf")

// }




// return(

// <div className="bg-white shadow rounded p-6">


// {/* HEADER */}

// <div className="flex justify-between items-center mb-6">

// <h2 className="font-semibold text-lg">
// Account Ledger
// </h2>


// <div className="flex gap-3">

// <button
// onClick={exportExcel}
// className="border px-3 py-1 rounded text-sm"
// >
// Export Excel
// </button>

// <button
// onClick={exportPDF}
// className="border px-3 py-1 rounded text-sm"
// >
// Export PDF
// </button>

// </div>


// <div className="w-[250px]">

// <Select
// value={selectedAccount}
// onValueChange={(v)=>setSelectedAccount(v)}
// >

// <SelectTrigger>
// <SelectValue placeholder="Select Account"/>
// </SelectTrigger>

// <SelectContent>

// <SelectItem value="iedge">
// iEDGE
// </SelectItem>

// <SelectItem value="iedge-travel">
// IEDGE Travel & Tours
// </SelectItem>

// </SelectContent>

// </Select>

// </div>

// </div>



// {/* SUMMARY */}

// <div className="grid grid-cols-3 gap-4 mb-6">

// <div className="border rounded p-4 bg-gray-50">

// <div className="text-sm text-gray-500">
// Total Received
// </div>

// <div className="text-xl font-bold text-green-600">
// Rs {totalReceived.toLocaleString()}
// </div>

// </div>


// <div className="border rounded p-4 bg-gray-50">

// <div className="text-sm text-gray-500">
// Total Transactions
// </div>

// <div className="text-xl font-bold">
// {filteredPayments.length}
// </div>

// </div>


// <div className="border rounded p-4 bg-gray-50">

// <div className="text-sm text-gray-500">
// Account
// </div>

// <div className="text-lg font-semibold">

// {selectedAccount==="iedge"
// ? "iEDGE"
// : "IEDGE Travel & Tours"}

// </div>

// </div>

// </div>




// {/* DATE FILTER BAR */}

// <div className="flex justify-between items-center mb-4">

// <div className="flex items-center gap-2">

// <span className="text-sm text-gray-600">
// Date Range:
// </span>

// {["all","today","thisMonth","lastMonth"].map(range=>(

// <button
// key={range}
// onClick={()=>{

// setDateRange(range)
// setPage(1)

// }}
// className={`px-3 py-1 rounded text-sm border
// ${dateRange===range
// ? "bg-black text-white"
// : "bg-white hover:bg-gray-100"}
// `}
// >

// {range==="all" && "All"}
// {range==="today" && "Today"}
// {range==="thisMonth" && "This Month"}
// {range==="lastMonth" && "Last Month"}

// </button>

// ))}

// <span className="ml-4 text-sm text-gray-500">

// Showing {filteredPayments.length} result(s)

// </span>

// </div>


// <div className="flex items-center gap-4">

// <div className="flex items-center gap-2">

// <span className="text-sm">
// Rows:
// </span>

// <select
// value={perPage}
// onChange={(e)=>{

// setPerPage(Number(e.target.value))
// setPage(1)

// }}
// className="border rounded px-2 py-1 text-sm"
// >

// <option value={10}>10</option>
// <option value={25}>25</option>
// <option value={50}>50</option>

// </select>

// </div>


// <button
// disabled={page===1}
// onClick={()=>setPage(page-1)}
// className="px-3 py-1 border rounded text-sm disabled:opacity-50"
// >
// Prev
// </button>

// <span className="text-sm">
// Page {page} / {totalPages || 1}
// </span>

// <button
// disabled={page===totalPages}
// onClick={()=>setPage(page+1)}
// className="px-3 py-1 border rounded text-sm disabled:opacity-50"
// >
// Next
// </button>

// </div>

// </div>




// {/* SEARCH */}

// <div className="grid grid-cols-2 gap-4 mb-6">

// <input
// type="text"
// placeholder="Search Client"
// className="border p-2 rounded"
// value={clientFilter}
// onChange={(e)=>setClientFilter(e.target.value)}
// />

// <input
// type="text"
// placeholder="Search Invoice"
// className="border p-2 rounded"
// value={invoiceFilter}
// onChange={(e)=>setInvoiceFilter(e.target.value)}
// />

// </div>



// {/* TABLE */}

// <div className="border rounded overflow-hidden">

// <table className="w-full text-sm">

// <thead className="bg-gray-100">

// <tr>

// <th className="p-3 text-left">
// Date
// </th>

// <th className="p-3 text-left">
// Invoice
// </th>

// <th className="p-3 text-left">
// Client
// </th>

// <th className="p-3 text-left">
// Payment Method
// </th>

// <th className="p-3 text-left">
// Reference
// </th>

// <th className="p-3 text-right">
// Invoice Total
// </th>

// <th className="p-3 text-right">
// Amount
// </th>

// <th className="p-3 text-right">
// Pending
// </th>

// </tr>

// </thead>

// <tbody>

// {paginated.map(p=>(

// <tr key={p.id} className="border-b">

// <td className="p-3">
// {p.paymentDate}
// </td>

// <td className="p-3 font-medium">
// {p.invoiceNo}
// </td>

// <td className="p-3">
// {p.client}
// </td>

// <td className="p-3">
// {p.method}
// </td>

// <td className="p-3">
// {p.reference}
// </td>

// <td className="p-3 text-right text-blue-600">
// Rs {Number(p.invoiceTotal).toLocaleString()}
// </td>

// <td className="p-3 text-right text-green-600 font-semibold">
// Rs {Number(p.amount).toLocaleString()}
// </td>

// <td className="p-3 text-right text-red-600">
// Rs {Number(p.balanceAfter).toLocaleString()}
// </td>

// </tr>

// ))}

// </tbody>

// </table>

// </div>

// </div>

// )

// }

// import { useEffect, useMemo, useState } from "react"
// import { collection, getDocs } from "firebase/firestore"
// import { db } from "@/lib/firebase"
// import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts"
// import { PaymentAccount } from "@/lib/payments/types"

// import * as XLSX from "xlsx"
// import jsPDF from "jspdf"
// import autoTable from "jspdf-autotable"

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue
// } from "@/components/ui/select"

// interface Payment {
//   id: string
//   paymentDate: string
//   invoiceNo: string
//   client: string
//   method: string
//   reference: string
//   amount: number
//   invoiceTotal: number
//   balanceAfter: number
//   depositTo: string
// }

// type AccountOption = {
//   value: string
//   label: string
// }

// export default function PaymentTransactions() {
//   const [payments, setPayments] = useState<Payment[]>([])
//   const [accounts, setAccounts] = useState<PaymentAccount[]>([])
//   const [selectedAccount, setSelectedAccount] = useState("all")

//   const [clientFilter, setClientFilter] = useState("")
//   const [invoiceFilter, setInvoiceFilter] = useState("")
//   const [dateRange, setDateRange] = useState("all")

//   const [page, setPage] = useState(1)
//   const [perPage, setPerPage] = useState(10)

//   useEffect(() => {
//     fetchAllData()
//   }, [])

// const fetchAllData = async () => {
//   const [paymentSnap, invoiceSnap, accountRows] = await Promise.all([
//     getDocs(collection(db, "Panels", "IEDGE-SYSTEM", "payments")),
//     getDocs(collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices")),
//     fetchPaymentAccounts(),
//   ]);

//   const invoiceMap: any = {};

//   invoiceSnap.forEach((doc) => {
//     invoiceMap[doc.id] = doc.data();
//   });

//   const data: Payment[] = [];

//   paymentSnap.forEach((doc) => {
//     const p: any = doc.data();
//     const invoice = invoiceMap[p.invoiceId];

//     data.push({
//       id: doc.id,
//       paymentDate: p.paymentDate,
//       client: p.client,
//       method: p.method,
//       reference: p.reference,
//       amount: Number(p.amount || 0),
//       invoiceNo: p.invoiceNo || invoice?.invoiceNo || "-",
//       invoiceTotal: Number(invoice?.total ?? 0),
//       balanceAfter: Number(
//         p.balanceAfter ?? invoice?.balance ?? invoice?.total ?? 0
//       ),
//       depositTo: p.depositTo || "",
//     });
//   });

//   setPayments(data);
//   setAccounts(accountRows.filter((account) => account.isActive !== false));
// };

// const accountOptions = useMemo<AccountOption[]>(() => {
//   return [
//     { value: "all", label: "All Accounts" },
//     ...accounts.map((account) => ({
//       value: account.id,
//       label: account.accountName || account.bankName || "Unnamed Account"
//     }))
//   ]
// }, [accounts])

// const accountLabelMap = useMemo(() => {
//   const map: Record<string, string> = {
//     all: "All Accounts"
//   }

//   accounts.forEach((account) => {
//     map[account.id] =
//       account.accountName || account.bankName || "Unnamed Account"
//   })

//   return map
// }, [accounts])

//   const getDateRange = () => {
//     const now = new Date()

//     if (dateRange === "today") {
//       return new Date(
//         now.getFullYear(),
//         now.getMonth(),
//         now.getDate()
//       )
//     }

//     if (dateRange === "thisMonth") {
//       return new Date(
//         now.getFullYear(),
//         now.getMonth(),
//         1
//       )
//     }

//     if (dateRange === "lastMonth") {
//       return new Date(
//         now.getFullYear(),
//         now.getMonth() - 1,
//         1
//       )
//     }

//     return null
//   }

//   const rangeDate = getDateRange()

//   let filteredPayments = payments.filter((p) => {
//     if (selectedAccount !== "all" && p.depositTo !== selectedAccount) {
//       return false
//     }

//     if (
//       clientFilter &&
//       !p.client?.toLowerCase().includes(clientFilter.toLowerCase())
//     ) {
//       return false
//     }

//     if (
//       invoiceFilter &&
//       !p.invoiceNo?.toLowerCase().includes(invoiceFilter.toLowerCase())
//     ) {
//       return false
//     }

//     if (rangeDate) {
//       if (new Date(p.paymentDate) < rangeDate) return false
//     }

//     return true
//   })

//   filteredPayments = filteredPayments.sort((a, b) => {
//     return (
//       new Date(b.paymentDate).getTime() -
//       new Date(a.paymentDate).getTime()
//     )
//   })

//   const totalReceived = filteredPayments.reduce(
//     (sum, p) => sum + Number(p.amount || 0),
//     0
//   )

//   const totalPages = Math.max(1, Math.ceil(filteredPayments.length / perPage))

//   const paginated = filteredPayments.slice(
//     (page - 1) * perPage,
//     page * perPage
//   )

//   const exportExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(filteredPayments)
//     const workbook = XLSX.utils.book_new()

//     XLSX.utils.book_append_sheet(
//       workbook,
//       worksheet,
//       "Ledger"
//     )

//     XLSX.writeFile(workbook, "ledger.xlsx")
//   }

//   const exportPDF = () => {
//     const doc = new jsPDF()

//     autoTable(doc, {
//       head: [[
//         "Date",
//         "Invoice",
//         "Client",
//         "Method",
//         "Reference",
//         "Invoice Total",
//         "Amount",
//         "Pending",
//         "Account"
//       ]],
//       body: filteredPayments.map((p) => [
//         p.paymentDate,
//         p.invoiceNo,
//         p.client,
//         p.method,
//         p.reference,
//         p.invoiceTotal,
//         p.amount,
//         p.balanceAfter,
//         accountLabelMap[p.depositTo] || p.depositTo || "-"
//       ])
//     })

//     doc.save("ledger.pdf")
//   }

//   return (
//     <div className="bg-white shadow rounded p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="font-semibold text-lg">
//           Account Ledger
//         </h2>

//         <div className="flex gap-3">
//           <button
//             onClick={exportExcel}
//             className="border px-3 py-1 rounded text-sm"
//           >
//             Export Excel
//           </button>

//           <button
//             onClick={exportPDF}
//             className="border px-3 py-1 rounded text-sm"
//           >
//             Export PDF
//           </button>
//         </div>

//         <div className="w-[250px]">
//           <Select
//             value={selectedAccount}
//             onValueChange={(v) => {
//               setSelectedAccount(v)
//               setPage(1)
//             }}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="Select Account" />
//             </SelectTrigger>

//             <SelectContent>
//               {accountOptions.map((account) => (
//                 <SelectItem key={account.value} value={account.value}>
//                   {account.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       <div className="grid grid-cols-3 gap-4 mb-6">
//         <div className="border rounded p-4 bg-gray-50">
//           <div className="text-sm text-gray-500">
//             Total Received
//           </div>

//           <div className="text-xl font-bold text-green-600">
//             Rs {totalReceived.toLocaleString()}
//           </div>
//         </div>

//         <div className="border rounded p-4 bg-gray-50">
//           <div className="text-sm text-gray-500">
//             Total Transactions
//           </div>

//           <div className="text-xl font-bold">
//             {filteredPayments.length}
//           </div>
//         </div>

//         <div className="border rounded p-4 bg-gray-50">
//           <div className="text-sm text-gray-500">
//             Account
//           </div>

//           <div className="text-lg font-semibold">
//             {accountLabelMap[selectedAccount] || "All Accounts"}
//           </div>
//         </div>
//       </div>

//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <span className="text-sm text-gray-600">
//             Date Range:
//           </span>

//           {["all", "today", "thisMonth", "lastMonth"].map((range) => (
//             <button
//               key={range}
//               onClick={() => {
//                 setDateRange(range)
//                 setPage(1)
//               }}
//               className={`px-3 py-1 rounded text-sm border ${
//                 dateRange === range
//                   ? "bg-black text-white"
//                   : "bg-white hover:bg-gray-100"
//               }`}
//             >
//               {range === "all" && "All"}
//               {range === "today" && "Today"}
//               {range === "thisMonth" && "This Month"}
//               {range === "lastMonth" && "Last Month"}
//             </button>
//           ))}

//           <span className="ml-4 text-sm text-gray-500">
//             Showing {filteredPayments.length} result(s)
//           </span>
//         </div>

//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-2">
//             <span className="text-sm">
//               Rows:
//             </span>

//             <select
//               value={perPage}
//               onChange={(e) => {
//                 setPerPage(Number(e.target.value))
//                 setPage(1)
//               }}
//               className="border rounded px-2 py-1 text-sm"
//             >
//               <option value={10}>10</option>
//               <option value={25}>25</option>
//               <option value={50}>50</option>
//             </select>
//           </div>

//           <button
//             disabled={page === 1}
//             onClick={() => setPage(page - 1)}
//             className="px-3 py-1 border rounded text-sm disabled:opacity-50"
//           >
//             Prev
//           </button>

//           <span className="text-sm">
//             Page {page} / {totalPages}
//           </span>

//           <button
//             disabled={page === totalPages}
//             onClick={() => setPage(page + 1)}
//             className="px-3 py-1 border rounded text-sm disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4 mb-6">
//         <input
//           type="text"
//           placeholder="Search Client"
//           className="border p-2 rounded"
//           value={clientFilter}
//           onChange={(e) => {
//             setClientFilter(e.target.value)
//             setPage(1)
//           }}
//         />

//         <input
//           type="text"
//           placeholder="Search Invoice"
//           className="border p-2 rounded"
//           value={invoiceFilter}
//           onChange={(e) => {
//             setInvoiceFilter(e.target.value)
//             setPage(1)
//           }}
//         />
//       </div>

//       <div className="border rounded overflow-hidden">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="p-3 text-left">Date</th>
//               <th className="p-3 text-left">Invoice</th>
//               <th className="p-3 text-left">Client</th>
//               <th className="p-3 text-left">Payment Method</th>
//               <th className="p-3 text-left">Reference</th>
//               <th className="p-3 text-left">Account</th>
//               <th className="p-3 text-right">Invoice Total</th>
//               <th className="p-3 text-right">Amount</th>
//               <th className="p-3 text-right">Pending</th>
//             </tr>
//           </thead>

//           <tbody>
//             {paginated.map((p) => (
//               <tr key={p.id} className="border-b">
//                 <td className="p-3">{p.paymentDate}</td>
//                 <td className="p-3 font-medium">{p.invoiceNo}</td>
//                 <td className="p-3">{p.client}</td>
//                 <td className="p-3">{p.method}</td>
//                 <td className="p-3">{p.reference}</td>
//                 <td className="p-3">
//                   {accountLabelMap[p.depositTo] || "-"}
//                 </td>
//                 <td className="p-3 text-right text-blue-600">
//                   Rs {Number(p.invoiceTotal).toLocaleString()}
//                 </td>
//                 <td className="p-3 text-right text-green-600 font-semibold">
//                   Rs {Number(p.amount).toLocaleString()}
//                 </td>
//                 <td className="p-3 text-right text-red-600">
//                   Rs {Number(p.balanceAfter).toLocaleString()}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   )
// }





import { useEffect, useMemo, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts"
import type { PaymentAccount } from "@/lib/payments/types"

import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Payment {
  id: string
  paymentDate: string
  invoiceNo: string
  client: string
  method: string
  reference: string
  amount: number
  invoiceTotal: number
  balanceAfter: number
  depositTo: string
}

type AccountOption = {
  value: string
  label: string
}

type DateRange = "all" | "today" | "thisMonth" | "lastMonth"

export default function PaymentTransactions() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState("all")

  const [clientFilter, setClientFilter] = useState("")
  const [invoiceFilter, setInvoiceFilter] = useState("")
  const [dateRange, setDateRange] = useState<DateRange>("all")

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError("")

      const [paymentSnap, invoiceSnap, accountRows] = await Promise.all([
        getDocs(collection(db, "Panels", "IEDGE-SYSTEM", "payments")),
        getDocs(collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices")),
        fetchPaymentAccounts(),
      ])

      const invoiceMap: Record<string, any> = {}

      invoiceSnap.forEach((doc) => {
        invoiceMap[doc.id] = doc.data()
      })

      const data: Payment[] = []

      paymentSnap.forEach((doc) => {
        const p: any = doc.data()
        const invoice = invoiceMap[p.invoiceId]

        data.push({
          id: doc.id,
          paymentDate: p.paymentDate || "",
          client: p.client || "-",
          method: p.method || "-",
          reference: p.reference || "-",
          amount: Number(p.amount || 0),
          invoiceNo: p.invoiceNo || invoice?.invoiceNo || "-",
          invoiceTotal: Number(invoice?.total ?? 0),
          balanceAfter: Number(
            p.balanceAfter ?? invoice?.balance ?? invoice?.total ?? 0
          ),
          depositTo: p.depositTo || "",
        })
      })

      setPayments(data)
      setAccounts(accountRows.filter((account) => account.isActive !== false))
    } catch (err) {
      console.error(err)
      setError("Unable to load payment transactions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const accountOptions = useMemo<AccountOption[]>(() => {
    return [
      { value: "all", label: "All Accounts" },
      ...accounts.map((account) => ({
        value: account.id,
        label: account.accountName || account.bankName || "Unnamed Account",
      })),
    ]
  }, [accounts])

  const accountLabelMap = useMemo(() => {
    const map: Record<string, string> = {
      all: "All Accounts",
    }

    accounts.forEach((account) => {
      map[account.id] =
        account.accountName || account.bankName || "Unnamed Account"
    })

    return map
  }, [accounts])

  const getDateRangeBounds = () => {
    const now = new Date()

    if (dateRange === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

      return { start, end }
    }

    if (dateRange === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      return { start, end }
    }

    if (dateRange === "lastMonth") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 1)

      return { start, end }
    }

    return null
  }

  const filteredPayments = useMemo(() => {
    const bounds = getDateRangeBounds()

    return payments
      .filter((p) => {
        if (selectedAccount !== "all" && p.depositTo !== selectedAccount) {
          return false
        }

        if (
          clientFilter &&
          !p.client?.toLowerCase().includes(clientFilter.toLowerCase())
        ) {
          return false
        }

        if (
          invoiceFilter &&
          !p.invoiceNo?.toLowerCase().includes(invoiceFilter.toLowerCase())
        ) {
          return false
        }

        if (bounds && p.paymentDate) {
          const paymentDate = new Date(p.paymentDate)

          if (paymentDate < bounds.start || paymentDate >= bounds.end) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        return (
          new Date(b.paymentDate).getTime() -
          new Date(a.paymentDate).getTime()
        )
      })
  }, [payments, selectedAccount, clientFilter, invoiceFilter, dateRange])

  const totalReceived = filteredPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  )

  const totalInvoiceValue = filteredPayments.reduce(
    (sum, p) => sum + Number(p.invoiceTotal || 0),
    0
  )

  const totalPending = filteredPayments.reduce(
    (sum, p) => sum + Number(p.balanceAfter || 0),
    0
  )

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / perPage))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginatedPayments = filteredPayments.slice(
    (page - 1) * perPage,
    page * perPage
  )

  const startRow =
    filteredPayments.length === 0 ? 0 : (page - 1) * perPage + 1

  const endRow = Math.min(page * perPage, filteredPayments.length)

  const pageNumbers = useMemo(() => {
    const pages: Array<number | "..."> = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    pages.push(1)

    if (page > 3) pages.push("...")

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) pages.push(i)

    if (page < totalPages - 2) pages.push("...")

    pages.push(totalPages)

    return pages
  }, [page, totalPages])

  const resetFilters = () => {
    setSelectedAccount("all")
    setClientFilter("")
    setInvoiceFilter("")
    setDateRange("all")
    setPage(1)
  }

  const formatCurrency = (value: number) => {
    return `Rs ${Number(value || 0).toLocaleString()}`
  }

  const formatDate = (value: string) => {
    if (!value) return "-"

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPayments.map((p) => ({
        Date: p.paymentDate,
        Invoice: p.invoiceNo,
        Client: p.client,
        Method: p.method,
        Reference: p.reference,
        "Invoice Total": p.invoiceTotal,
        Amount: p.amount,
        Pending: p.balanceAfter,
        Account: accountLabelMap[p.depositTo] || p.depositTo || "-",
      }))
    )

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger")
    XLSX.writeFile(workbook, "ledger.xlsx")
  }

  const exportPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("Account Ledger", 14, 16)

    doc.setFontSize(10)
    doc.text(`Total Received: ${formatCurrency(totalReceived)}`, 14, 24)

    autoTable(doc, {
      startY: 32,
      head: [
        [
          "Date",
          "Invoice",
          "Client",
          "Method",
          "Reference",
          "Invoice Total",
          "Amount",
          "Pending",
          "Account",
        ],
      ],
      body: filteredPayments.map((p) => [
        formatDate(p.paymentDate),
        p.invoiceNo,
        p.client,
        p.method,
        p.reference,
        formatCurrency(p.invoiceTotal),
        formatCurrency(p.amount),
        formatCurrency(p.balanceAfter),
        accountLabelMap[p.depositTo] || p.depositTo || "-",
      ]),
    })

    doc.save("ledger.pdf")
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto  space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Payment Transactions
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Account Ledger
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Track received payments, invoice balances, payment methods,
                  references, and deposit accounts in one clean view.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={exportExcel}
                  disabled={filteredPayments.length === 0}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Export Excel
                </button>

                <button
                  onClick={exportPDF}
                  disabled={filteredPayments.length === 0}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-100 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Total Received
              </p>
              <h3 className="mt-3 text-2xl font-bold text-emerald-600">
                {formatCurrency(totalReceived)}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Total Transactions
              </p>
              <h3 className="mt-3 text-2xl font-bold text-slate-950">
                {filteredPayments.length}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Invoice Value
              </p>
              <h3 className="mt-3 text-2xl font-bold text-blue-600">
                {formatCurrency(totalInvoiceValue)}
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Pending Balance
              </p>
              <h3 className="mt-3 text-2xl font-bold text-rose-600">
                {formatCurrency(totalPending)}
              </h3>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_280px_auto]">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Client
                  </label>
                  <input
                    type="text"
                    placeholder="Search by client name"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    value={clientFilter}
                    onChange={(e) => {
                      setClientFilter(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice
                  </label>
                  <input
                    type="text"
                    placeholder="Search invoice no"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    value={invoiceFilter}
                    onChange={(e) => {
                      setInvoiceFilter(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Account
                  </label>
                  <Select
                    value={selectedAccount}
                    onValueChange={(v) => {
                      setSelectedAccount(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>

                    <SelectContent>
                      {accountOptions.map((account) => (
                        <SelectItem key={account.value} value={account.value}>
                          {account.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 lg:w-auto"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "today", label: "Today" },
                  { value: "thisMonth", label: "This Month" },
                  { value: "lastMonth", label: "Last Month" },
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      setDateRange(range.value as DateRange)
                      setPage(1)
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      dateRange === range.value
                        ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">
                    Transaction Records
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Showing {startRow} to {endRow} of {filteredPayments.length}{" "}
                    transactions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-500">
                    Rows per page
                  </span>

                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value))
                      setPage(1)
                    }}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4 text-left font-bold">Date</th>
                      <th className="px-5 py-4 text-left font-bold">
                        Invoice
                      </th>
                      <th className="px-5 py-4 text-left font-bold">Client</th>
                      <th className="px-5 py-4 text-left font-bold">
                        Method
                      </th>
                      <th className="px-5 py-4 text-left font-bold">
                        Reference
                      </th>
                      <th className="px-5 py-4 text-left font-bold">
                        Account
                      </th>
                      <th className="px-5 py-4 text-right font-bold">
                        Invoice Total
                      </th>
                      <th className="px-5 py-4 text-right font-bold">
                        Amount
                      </th>
                      <th className="px-5 py-4 text-right font-bold">
                        Pending
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <tr key={index}>
                          {Array.from({ length: 9 }).map((__, cellIndex) => (
                            <td key={cellIndex} className="px-5 py-4">
                              <div className="h-4 animate-pulse rounded-full bg-slate-100" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : paginatedPayments.length > 0 ? (
                      paginatedPayments.map((p) => (
                        <tr
                          key={p.id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                            {formatDate(p.paymentDate)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {p.invoiceNo}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-950">
                            {p.client}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {p.method}
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {p.reference || "-"}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {accountLabelMap[p.depositTo] || "-"}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-blue-600">
                            {formatCurrency(p.invoiceTotal)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-emerald-600">
                            {formatCurrency(p.amount)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-rose-600">
                            {formatCurrency(p.balanceAfter)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-5 py-16 text-center">
                          <div className="mx-auto max-w-sm">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                              ₨
                            </div>

                            <h3 className="text-base font-bold text-slate-950">
                              No transactions found
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                              Try changing your filters or reset the search to
                              view all payment transactions.
                            </p>

                            <button
                              onClick={resetFilters}
                              className="mt-5 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Reset Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-900">{page}</span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {totalPages}
                  </span>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(1)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    First
                  </button>

                  <button
                    disabled={page === 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {pageNumbers.map((item, index) =>
                      item === "..." ? (
                        <span
                          key={`dots-${index}`}
                          className="px-2 text-sm text-slate-400"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item)}
                          className={`h-10 min-w-10 rounded-xl px-3 text-sm font-bold transition ${
                            page === item
                              ? "bg-slate-950 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    disabled={page === totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(totalPages)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}