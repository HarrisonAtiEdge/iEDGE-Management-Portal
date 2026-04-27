// import { Button } from "@/components/ui/button"
// import { useEffect, useState } from "react"
// import { addDoc, collection, query, where, getDocs, serverTimestamp, updateDoc, doc } from "firebase/firestore"
// import { db } from "@/lib/firebase"
// import { Label } from "@/components/ui/label"
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue
// } from "@/components/ui/select"

// type Props = {
//     invoice: any
//     onClose: () => void
// }

// export default function ReceivePaymentModal({ invoice, onClose }: Props) {

//     const [amount, setAmount] = useState("")
//     const [paymentDate, setPaymentDate] = useState("")
//     const [method, setMethod] = useState("")
//     const [reference, setReference] = useState("")
//     const [depositTo, setDepositTo] = useState("")
//     const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([])
//     const [payments, setPayments] = useState<any[]>([])
//     const [searchInvoice, setSearchInvoice] = useState("")

//     useEffect(() => {

//         fetchOutstanding()
//         fetchPayments()

//     }, [invoice.client])


//     const fetchOutstanding = async () => {

//         const q = query(
//             collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
//             where("client", "==", invoice.client),
//             where("status", "!=", "Paid")
//         )

//         const snapshot = await getDocs(q)

//         const data: any[] = []

//         snapshot.forEach(doc => {
//             data.push({
//                 id: doc.id,
//                 ...doc.data()
//             })
//         })

//         setOutstandingInvoices(data)

//     }


//     const fetchPayments = async () => {

//         const q = query(
//             collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
//             where("client", "==", invoice.client)
//         )

//         const snapshot = await getDocs(q)

//         const data: any[] = []

//         snapshot.forEach(doc => {
//             data.push({
//                 id: doc.id,
//                 ...doc.data()
//             })
//         })

//         setPayments(data)

//     }


//     const handleSave = async () => {

//         try {

//             await addDoc(
//                 collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
//                 {
//                     invoiceId: invoice.id,
//                     client: invoice.client,
//                     amount: Number(amount),
//                     paymentDate,
//                     method,
//                     reference,
//                     depositTo,
//                     createdAt: serverTimestamp()
//                 }
//             )

//             const currentBalance = invoice.balance ?? invoice.total
//             const newBalance = currentBalance - Number(amount)

//             await updateDoc(
//                 doc(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices", invoice.id),
//                 {
//                     balance: newBalance,
//                     status: newBalance <= 0 ? "Paid" : "Partially Paid"
//                 }
//             )

//             onClose()

//         } catch (error) {

//             console.error("Payment Error:", error)

//         }

//     }

//     const total = invoice.total
//     const balance = invoice.balance ?? invoice.total
//     const paid = total - balance

//     const paidPercent = ((paid / total) * 100).toFixed(1)
//     const remainingPercent = (100 - Number(paidPercent)).toFixed(1)

//     return (

//         <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

//             <div className="bg-white w-[1000px] p-6 rounded-lg shadow">

//                 <h2 className="text-lg font-semibold mb-4">
//                     Receive Payment
//                 </h2>

//                 <div className="grid grid-cols-2 gap-6">

//                     {/* LEFT SIDE FORM */}

//                     <div className="space-y-4">

//                         <div>
//                             <Label>Customer</Label>
//                             <input
//                                 className="border p-2 w-full rounded"
//                                 value={invoice.client}
//                                 readOnly
//                             />
//                         </div>

//                         <div>
//                             <Label>Email</Label>
//                             <input
//                                 className="border p-2 w-full rounded"
//                                 value={invoice.email}
//                                 readOnly
//                             />
//                         </div>

//                         <div>
//                             <Label>Payment Date</Label>
//                             <input
//                                 type="date"
//                                 className="border p-2 w-full rounded"
//                                 value={paymentDate}
//                                 onChange={(e) => setPaymentDate(e.target.value)}
//                             />
//                         </div>

//                         <div>
//                             <Label>Payment Method</Label>
//                             <select
//                                 className="border p-2 w-full rounded"
//                                 value={method}
//                                 onChange={(e) => setMethod(e.target.value)}
//                             >
//                                 <option value="">Select Method</option>
//                                 <option>Cash</option>
//                                 <option>Check</option>
//                                 <option>Credit Card</option>
//                                 <option>Direct Debit</option>
//                             </select>
//                         </div>

//                         <div>
//                             <Label>Reference No</Label>
//                             <input
//                                 className="border p-2 w-full rounded"
//                                 value={reference}
//                                 onChange={(e) => setReference(e.target.value)}
//                             />
//                         </div>

//                         <div>

//                             <Label>Deposit To (Account)</Label>

//                             <Select
//                                 value={depositTo}
//                                 onValueChange={(value) => setDepositTo(value)}
//                             >

//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Select account" />
//                                 </SelectTrigger>

//                                 <SelectContent>

//                                     <SelectItem value="iedge">
//                                         iEDGE
//                                     </SelectItem>

//                                     <SelectItem value="iedge-travel">
//                                         IEDGE TRAVEL & TOURS (PRIVATE) LIMITED
//                                     </SelectItem>

//                                 </SelectContent>

//                             </Select>

//                         </div>

//                     </div>


//                     {/* RIGHT SIDE PAYMENT INFO */}

//                     <div className="border p-4 rounded-lg space-y-4 bg-gray-50">

//                         <div>

//                             <div className="text-xs text-gray-500">
//                                 Amount Due
//                             </div>

//                             <div className="text-xl font-bold">
//                                 Rs {invoice.total}
//                             </div>

//                         </div>


//                         <div>

//                             <div className="text-xs text-gray-500">
//                                 Customer Balance
//                             </div>

//                             <div className="text-lg font-semibold">
//                                 Rs {invoice.balance || invoice.total}
//                             </div>

//                             <div className="text-xs text-gray-500">
//                                 Paid: {paidPercent}% | Remaining: {remainingPercent}%
//                             </div>

//                             <div className="w-full bg-gray-200 rounded h-2 mt-1">
//                                 <div
//                                     className="bg-green-500 h-2 rounded"
//                                     style={{ width: `${paidPercent}%` }}
//                                 />
//                             </div>

//                         </div>




//                         <div>

//                             <Label>Amount Received</Label>

//                             <input
//                                 type="number"
//                                 className="border p-2 w-full rounded"
//                                 value={amount}
//                                 onChange={(e) => setAmount(e.target.value)}
//                             />

//                         </div>

//                     </div>

//                 </div>


//                 {/* TRANSACTIONS SECTION */}

//                 <div className="grid grid-cols-2 gap-6 mt-8">

//                     {/* Outstanding */}

//                     <div>

//                         <h3 className="mb-2 font-semibold">
//                             Outstanding Transactions
//                         </h3>
//                         <input
//                             placeholder="Search Invoice..."
//                             className="border p-2 w-full mb-2 rounded"
//                             value={searchInvoice}
//                             onChange={(e) => setSearchInvoice(e.target.value)}
//                         />

//                         <div className="h-[150px] overflow-y-auto border rounded">
//                             <table className="w-full text-sm">

//                                 <thead className="bg-gray-100">

//                                     <tr>
//                                         <th className="p-2 text-left">Invoice</th>
//                                         <th className="p-2 text-left">Date</th>
//                                         <th className="p-2 text-right">Amount</th>
//                                         <th className="p-2 text-right">Balance</th>
//                                     </tr>

//                                 </thead>

//                                 <tbody>

//                                     {outstandingInvoices
//                                         .filter(inv =>
//                                             inv.invoiceNo?.toLowerCase().includes(searchInvoice.toLowerCase())
//                                         )
//                                         .sort((a, b) => (a.id === invoice.id ? -1 : b.id === invoice.id ? 1 : 0))
//                                         .map(inv => (

//                                             <tr
//                                                 key={inv.id}
//                                                 className={`border-b ${inv.id === invoice.id ? "bg-yellow-100 font-semibold" : ""
//                                                     }`}
//                                             >

//                                                 <td className="p-2">{inv.invoiceNo}</td>
//                                                 <td className="p-2">{inv.invoiceDate}</td>
//                                                 <td className="p-2 text-right">Rs {inv.total}</td>
//                                                 <td className="p-2 text-right">Rs {inv.balance}</td>

//                                             </tr>

//                                         ))}

//                                 </tbody>

//                             </table>
//                         </div>

//                     </div>


//                     {/* Payment History */}

//                     <div>

//                         <h3 className="mb-2 font-semibold">
//                             Payment History
//                         </h3>

//                         <table className="w-full border text-sm">

//                             <thead className="bg-gray-100">

//                                 <tr>
//                                     <th className="p-2 text-left">Date</th>
//                                     <th className="p-2 text-left">Method</th>
//                                     <th className="p-2 text-left">Reference</th>
//                                     <th className="p-2 text-right">Amount</th>
//                                 </tr>

//                             </thead>

//                             <tbody>

//                                 {payments.map(p => (

//                                     <tr key={p.id} className="border-b">

//                                         <td className="p-2">{p.paymentDate}</td>
//                                         <td className="p-2">{p.method}</td>
//                                         <td className="p-2">{p.reference}</td>
//                                         <td className="p-2 text-right">Rs {p.amount}</td>

//                                     </tr>

//                                 ))}

//                             </tbody>

//                         </table>

//                     </div>

//                 </div>


//                 {/* BUTTONS */}

//                 <div className="flex justify-end gap-3 mt-6">

//                     <Button variant="outline" onClick={onClose}>
//                         Cancel
//                     </Button>

//                     <Button
//                         className="bg-green-600 text-white"
//                         onClick={handleSave}
//                     >
//                         Save Payment
//                     </Button>

//                 </div>

//             </div>

//         </div>

//     )
// }

// import { Button } from "@/components/ui/button"
// import { useEffect, useState } from "react"
// import {
//   addDoc,
//   collection,
//   query,
//   where,
//   getDocs,
//   serverTimestamp,
//   updateDoc,
//   doc,
// } from "firebase/firestore"
// import { db } from "@/lib/firebase"
// import { Label } from "@/components/ui/label"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts"
// import { PaymentAccount } from "@/lib/payments/types"

// type Props = {
//   invoice: any
//   onClose: () => void
// }

// export default function ReceivePaymentModal({ invoice, onClose }: Props) {
//   const [amount, setAmount] = useState("")
//   const [paymentDate, setPaymentDate] = useState("")
//   const [method, setMethod] = useState("")
//   const [reference, setReference] = useState("")
//   const [depositTo, setDepositTo] = useState("")
//   const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([])
//   const [payments, setPayments] = useState<any[]>([])
//   const [searchInvoice, setSearchInvoice] = useState("")
//   const [accounts, setAccounts] = useState<PaymentAccount[]>([])

//   useEffect(() => {
//     fetchOutstanding()
//     fetchPayments()
//     loadAccounts()
//   }, [invoice.client])

//   const loadAccounts = async () => {
//     try {
//       const rows = await fetchPaymentAccounts()
//       setAccounts(rows.filter((account) => account.isActive !== false))
//     } catch (error) {
//       console.error("Failed to load payment accounts:", error)
//     }
//   }

//   const fetchOutstanding = async () => {
//     const q = query(
//       collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
//       where("client", "==", invoice.client),
//       where("status", "!=", "Paid")
//     )

//     const snapshot = await getDocs(q)

//     const data: any[] = []

//     snapshot.forEach((doc) => {
//       data.push({
//         id: doc.id,
//         ...doc.data(),
//       })
//     })

//     setOutstandingInvoices(data)
//   }

//   const fetchPayments = async () => {
//     const q = query(
//       collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
//       where("client", "==", invoice.client)
//     )

//     const snapshot = await getDocs(q)

//     const data: any[] = []

//     snapshot.forEach((doc) => {
//       data.push({
//         id: doc.id,
//         ...doc.data(),
//       })
//     })

//     setPayments(data)
//   }

//   const handleSave = async () => {
//     try {
//       await addDoc(collection(db, "Panels", "IEDGE-SYSTEM", "payments"), {
//         invoiceId: invoice.id,
//         client: invoice.client,
//         amount: Number(amount),
//         paymentDate,
//         method,
//         reference,
//         depositTo,
//         createdAt: serverTimestamp(),
//       })

//       const currentBalance = invoice.balance ?? invoice.total
//       const newBalance = currentBalance - Number(amount)

//       await updateDoc(
//         doc(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices", invoice.id),
//         {
//           balance: newBalance,
//           status: newBalance <= 0 ? "Paid" : "Partially Paid",
//         }
//       )

//       onClose()
//     } catch (error) {
//       console.error("Payment Error:", error)
//     }
//   }

//   const total = invoice.total
//   const balance = invoice.balance ?? invoice.total
//   const paid = total - balance

//   const paidPercent = total ? ((paid / total) * 100).toFixed(1) : "0.0"
//   const remainingPercent = (100 - Number(paidPercent)).toFixed(1)

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
//       <div className="w-[1000px] rounded-lg bg-white p-6 shadow">
//         <h2 className="mb-4 text-lg font-semibold">Receive Payment</h2>

//         <div className="grid grid-cols-2 gap-6">
//           <div className="space-y-4">
//             <div>
//               <Label>Customer</Label>
//               <input
//                 className="w-full rounded border p-2"
//                 value={invoice.client}
//                 readOnly
//               />
//             </div>

//             <div>
//               <Label>Email</Label>
//               <input
//                 className="w-full rounded border p-2"
//                 value={invoice.email}
//                 readOnly
//               />
//             </div>

//             <div>
//               <Label>Payment Date</Label>
//               <input
//                 type="date"
//                 className="w-full rounded border p-2"
//                 value={paymentDate}
//                 onChange={(e) => setPaymentDate(e.target.value)}
//               />
//             </div>

//             <div>
//               <Label>Payment Method</Label>
//               <select
//                 className="w-full rounded border p-2"
//                 value={method}
//                 onChange={(e) => setMethod(e.target.value)}
//               >
//                 <option value="">Select Method</option>
//                 <option>Cash</option>
//                 <option>Check</option>
//                 <option>Credit Card</option>
//                 <option>Direct Debit</option>
//               </select>
//             </div>

//             <div>
//               <Label>Reference No</Label>
//               <input
//                 className="w-full rounded border p-2"
//                 value={reference}
//                 onChange={(e) => setReference(e.target.value)}
//               />
//             </div>

//             <div>
//               <Label>Deposit To (Account)</Label>

//               <Select value={depositTo} onValueChange={(value) => setDepositTo(value)}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select account" />
//                 </SelectTrigger>

//                 <SelectContent>
//                   {accounts.length > 0 ? (
//                     accounts.map((account) => (
//                       <SelectItem key={account.id} value={account.id}>
//                         {account.accountName || account.bankName || "Unnamed Account"}
//                       </SelectItem>
//                     ))
//                   ) : (
//                     <SelectItem value="no-accounts" disabled>
//                       No active accounts found
//                     </SelectItem>
//                   )}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
//             <div>
//               <div className="text-xs text-gray-500">Amount Due</div>
//               <div className="text-xl font-bold">Rs {invoice.total}</div>
//             </div>

//             <div>
//               <div className="text-xs text-gray-500">Customer Balance</div>
//               <div className="text-lg font-semibold">
//                 Rs {invoice.balance || invoice.total}
//               </div>
//               <div className="text-xs text-gray-500">
//                 Paid: {paidPercent}% | Remaining: {remainingPercent}%
//               </div>
//             </div>

//             <div>
//               <Label>Amount Received</Label>
//               <input
//                 type="number"
//                 className="w-full rounded border p-2"
//                 value={amount}
//                 onChange={(e) => setAmount(e.target.value)}
//               />
//             </div>

//             <div className="flex justify-end gap-2 pt-4">
//               <Button variant="outline" onClick={onClose}>
//                 Cancel
//               </Button>

//               <Button onClick={handleSave}>Save Payment</Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }






import { Button } from "@/components/ui/button"
import { useEffect, useMemo, useState } from "react"
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts"
import { PaymentAccount } from "@/lib/payments/types"

type Props = {
  invoice: any
  onClose: () => void
}

type PaymentRow = {
  id: string
  invoiceId?: string
  client?: string
  amount?: number
  paymentDate?: string
  method?: string
  reference?: string
  depositTo?: string
  createdAt?: any
}

type InvoiceRow = {
  id: string
  invoiceNo?: string
  client?: string
  total?: number
  balance?: number
  status?: string
  dueDate?: string
}

type MethodDetails = {
  chequeNo: string
  bankName: string
  cardLast4: string
  approvalCode: string
  transactionId: string
  bankReference: string
  senderBank: string
}

const emptyMethodDetails: MethodDetails = {
  chequeNo: "",
  bankName: "",
  cardLast4: "",
  approvalCode: "",
  transactionId: "",
  bankReference: "",
  senderBank: "",
}

export default function ReceivePaymentModal({ invoice, onClose }: Props) {
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [method, setMethod] = useState("")
  const [reference, setReference] = useState("")
  const [depositTo, setDepositTo] = useState("")
  const [methodDetails, setMethodDetails] = useState<MethodDetails>(emptyMethodDetails)

  const [outstandingInvoices, setOutstandingInvoices] = useState<InvoiceRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchOutstanding()
    fetchPayments()
    loadAccounts()
  }, [invoice?.client, invoice?.id])

  const loadAccounts = async () => {
    try {
      const rows = await fetchPaymentAccounts()
      setAccounts(rows.filter((account) => account.isActive !== false))
    } catch (error) {
      console.error("Failed to load payment accounts:", error)
    }
  }

  const getAccountLabel = (accountId: string) => {
    const found = accounts.find((account) => account.id === accountId)
    if (!found) return "-"
    return found.accountName || found.bankName || "Unnamed Account"
  }

  const fetchOutstanding = async () => {
    try {
      const q = query(
        collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
        where("client", "==", invoice.client),
        where("status", "!=", "Paid")
      )

      const snapshot = await getDocs(q)
      const data: InvoiceRow[] = []

      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...(doc.data() as any),
        })
      })

      data.sort((a, b) => {
        const aDate = new Date(a.dueDate || 0).getTime()
        const bDate = new Date(b.dueDate || 0).getTime()
        return aDate - bDate
      })

      setOutstandingInvoices(data)
    } catch (error) {
      console.error("Failed to load outstanding invoices:", error)
    }
  }

  const fetchPayments = async () => {
    try {
      const q = query(
        collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
        where("invoiceId", "==", invoice.id)
      )

      const snapshot = await getDocs(q)
      const data: PaymentRow[] = []

      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...(doc.data() as any),
        })
      })

      data.sort((a, b) => {
        const aDate = new Date(a.paymentDate || 0).getTime()
        const bDate = new Date(b.paymentDate || 0).getTime()
        return bDate - aDate
      })

      setPayments(data)
    } catch (error) {
      console.error("Failed to load payment history:", error)
    }
  }

  const total = Number(invoice?.total || 0)
  const currentBalance = Number(invoice?.balance ?? invoice?.total ?? 0)
  const currentPaid = total - currentBalance

  const enteredAmount = Number(amount || 0)
  const projectedBalance = Math.max(currentBalance - enteredAmount, 0)
  const projectedPaid = total - projectedBalance

  const paidPercent = total > 0 ? ((projectedPaid / total) * 100).toFixed(1) : "0.0"
  const remainingPercent =
    total > 0 ? ((projectedBalance / total) * 100).toFixed(1) : "0.0"

  const totalHistoryPaid = useMemo(() => {
    return payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  }, [payments])

  const customerOutstandingTotal = useMemo(() => {
    return outstandingInvoices.reduce(
      (sum, item) => sum + Number(item.balance ?? item.total ?? 0),
      0
    )
  }, [outstandingInvoices])

  const resetMethodDetails = () => {
    setMethodDetails(emptyMethodDetails)
  }

  const handleMethodChange = (value: string) => {
    setMethod(value)
    setReference("")
    resetMethodDetails()
  }

  const getReferenceLabel = () => {
    switch (method) {
      case "Cash":
        return "Receipt / Reference No"
      case "Check":
        return "Cheque Deposit Reference"
      case "Credit Card":
        return "Card Payment Reference"
      case "Direct Debit":
        return "Direct Debit Reference"
      case "Bank Transfer":
        return "Transfer Reference"
      default:
        return "Reference No"
    }
  }

  const validateMethodFields = () => {
    if (method === "Check") {
      if (!methodDetails.chequeNo.trim()) {
        alert("Please enter cheque number.")
        return false
      }
      if (!methodDetails.bankName.trim()) {
        alert("Please enter bank name.")
        return false
      }
    }

    if (method === "Credit Card") {
      if (!methodDetails.cardLast4.trim()) {
        alert("Please enter card last 4 digits.")
        return false
      }
      if (!methodDetails.approvalCode.trim()) {
        alert("Please enter approval code.")
        return false
      }
    }

    if (method === "Direct Debit") {
      if (!methodDetails.transactionId.trim()) {
        alert("Please enter transaction ID.")
        return false
      }
    }

    if (method === "Bank Transfer") {
      if (!methodDetails.bankReference.trim()) {
        alert("Please enter bank reference.")
        return false
      }
      if (!methodDetails.senderBank.trim()) {
        alert("Please enter sender bank.")
        return false
      }
    }

    return true
  }

  const handleSave = async () => {
    if (!paymentDate) {
      alert("Please select payment date.")
      return
    }

    if (!method) {
      alert("Please select payment method.")
      return
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid payment amount.")
      return
    }

    if (!depositTo) {
      alert("Please select an account.")
      return
    }

    if (Number(amount) > currentBalance) {
      alert("Payment amount cannot be greater than remaining due.")
      return
    }

    if (!validateMethodFields()) {
      return
    }

    try {
      setLoading(true)

      const newBalance = currentBalance - Number(amount)

      await addDoc(collection(db, "Panels", "IEDGE-SYSTEM", "payments"), {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo || "",
        client: invoice.client,
        amount: Number(amount),
        paymentDate,
        method,
        reference,
        depositTo,
        balanceAfter: newBalance,
        methodDetails,
        createdAt: serverTimestamp(),
      })

      await updateDoc(
        doc(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices", invoice.id),
        {
          balance: newBalance,
          status: newBalance <= 0 ? "Paid" : "Partially Paid",
        }
      )

      onClose()
    } catch (error) {
      console.error("Payment Error:", error)
      alert("Failed to save payment.")
    } finally {
      setLoading(false)
    }
  }

  const renderDynamicMethodFields = () => {
    if (!method) return null

    if (method === "Cash") {
      return (
        <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Cash payment selected. No additional method details are required.
        </div>
      )
    }

    if (method === "Check") {
      return (
        <>
          <div>
            <Label>Cheque No</Label>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              value={methodDetails.chequeNo}
              onChange={(e) =>
                setMethodDetails((prev) => ({ ...prev, chequeNo: e.target.value }))
              }
              placeholder="Enter cheque number"
            />
          </div>

          <div>
            <Label>Bank Name</Label>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              value={methodDetails.bankName}
              onChange={(e) =>
                setMethodDetails((prev) => ({ ...prev, bankName: e.target.value }))
              }
              placeholder="Enter bank name"
            />
          </div>
        </>
      )
    }

    if (method === "Credit Card") {
      return (
        <>
          <div>
            <Label>Card Last 4 Digits</Label>
            <input
              maxLength={4}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              value={methodDetails.cardLast4}
              onChange={(e) =>
                setMethodDetails((prev) => ({
                  ...prev,
                  cardLast4: e.target.value.replace(/\D/g, "").slice(0, 4),
                }))
              }
              placeholder="1234"
            />
          </div>

          <div>
            <Label>Approval Code</Label>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              value={methodDetails.approvalCode}
              onChange={(e) =>
                setMethodDetails((prev) => ({
                  ...prev,
                  approvalCode: e.target.value,
                }))
              }
              placeholder="Enter approval code"
            />
          </div>
        </>
      )
    }

    if (method === "Direct Debit") {
      return (
        <div className="md:col-span-2">
          <Label>Transaction ID</Label>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
            value={methodDetails.transactionId}
            onChange={(e) =>
              setMethodDetails((prev) => ({
                ...prev,
                transactionId: e.target.value,
              }))
            }
            placeholder="Enter transaction ID"
          />
        </div>
      )
    }

    if (method === "Bank Transfer") {
      return (
        <>
          <div>
            <Label>Bank Reference</Label>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              value={methodDetails.bankReference}
              onChange={(e) =>
                setMethodDetails((prev) => ({
                  ...prev,
                  bankReference: e.target.value,
                }))
              }
              placeholder="Enter bank reference"
            />
          </div>

          <div>
            <Label>Sender Bank</Label>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
              value={methodDetails.senderBank}
              onChange={(e) =>
                setMethodDetails((prev) => ({
                  ...prev,
                  senderBank: e.target.value,
                }))
              }
              placeholder="Enter sender bank"
            />
          </div>
        </>
      )
    }

    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Receive Payment
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Record payment, review outstanding invoices, and track payment history.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-5 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    Invoice Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-slate-500">Customer</Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
                      value={invoice.client || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label className="text-slate-500">Invoice No</Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
                      value={invoice.invoiceNo || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label className="text-slate-500">Email</Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
                      value={invoice.email || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label className="text-slate-500">Invoice Total</Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium"
                      value={`Rs ${total.toLocaleString()}`}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    Payment Entry
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Payment Date</Label>
                    <input
                      type="date"
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Payment Method</Label>
                    <select
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      value={method}
                      onChange={(e) => handleMethodChange(e.target.value)}
                    >
                      <option value="">Select Method</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Direct Debit">Direct Debit</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {renderDynamicMethodFields()}

                  <div className="md:col-span-2">
                    <Label>{getReferenceLabel()}</Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={`Enter ${getReferenceLabel().toLowerCase()}`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Deposit To (Account)</Label>
                    <div className="mt-2">
                      <Select value={depositTo} onValueChange={(value) => setDepositTo(value)}>
                        <SelectTrigger className="h-11 rounded-xl border-slate-200">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>

                        <SelectContent>
                          {accounts.length > 0 ? (
                            accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.accountName || account.bankName || "Unnamed Account"}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__no_accounts__" disabled>
                              No active accounts found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Amount Received</Label>
                    <input
                      type="number"
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount received"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="rounded-xl"
                  >
                    {loading ? "Saving..." : "Save Payment"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-slate-500">Amount Due</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    Rs {total.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-slate-500">Paid So Far</div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-600">
                    Rs {currentPaid.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-slate-500">Remaining Due</div>
                  <div className="mt-2 text-2xl font-semibold text-rose-600">
                    Rs {currentBalance.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-slate-500">Status</div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    Paid: {paidPercent}% | Remaining: {remainingPercent}%
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${paidPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    Payment Summary
                  </h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Live Preview
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Entered Payment
                    </div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      Rs {enteredAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Balance After Payment
                    </div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      Rs {projectedBalance.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Payment Type
                    </div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      {enteredAmount > 0 && projectedBalance > 0
                        ? "Partial Payment"
                        : enteredAmount > 0 && projectedBalance <= 0
                        ? "Full Payment"
                        : "Not Entered"}
                    </div>
                  </div>
                </div>

                {enteredAmount > 0 && projectedBalance > 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Partial payment detected. Remaining due after this payment will be{" "}
                    <span className="font-semibold">
                      Rs {projectedBalance.toLocaleString()}
                    </span>
                    .
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    Outstanding Invoices
                  </h3>
                  <span className="text-sm text-slate-500">
                    Total Outstanding: Rs {customerOutstandingTotal.toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[680px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-3 text-left font-medium">Invoice No</th>
                        <th className="px-3 py-3 text-left font-medium">Status</th>
                        <th className="px-3 py-3 text-left font-medium">Due Date</th>
                        <th className="px-3 py-3 text-right font-medium">Total</th>
                        <th className="px-3 py-3 text-right font-medium">Balance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {outstandingInvoices.length > 0 ? (
                        outstandingInvoices.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="px-3 py-3 text-slate-700">
                              {item.invoiceNo || "-"}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  item.status === "Partially Paid"
                                    ? "bg-amber-50 text-amber-700"
                                    : item.status === "Paid"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {item.status || "Unpaid"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-700">
                              {item.dueDate || "-"}
                            </td>
                            <td className="px-3 py-3 text-right text-slate-700">
                              Rs {Number(item.total || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-slate-900">
                              Rs {Number(item.balance ?? item.total ?? 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-8 text-center text-sm text-slate-500"
                          >
                            No outstanding invoices found for this customer.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">
                    Payment History
                  </h3>
                  <span className="text-sm text-slate-500">
                    Total Received: Rs {totalHistoryPaid.toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-3 text-left font-medium">Date</th>
                        <th className="px-3 py-3 text-left font-medium">Method</th>
                        <th className="px-3 py-3 text-left font-medium">Reference</th>
                        <th className="px-3 py-3 text-left font-medium">Account</th>
                        <th className="px-3 py-3 text-right font-medium">Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {payments.length > 0 ? (
                        payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-slate-100">
                            <td className="px-3 py-3 text-slate-700">
                              {payment.paymentDate || "-"}
                            </td>
                            <td className="px-3 py-3 text-slate-700">
                              {payment.method || "-"}
                            </td>
                            <td className="px-3 py-3 text-slate-700">
                              {payment.reference || "-"}
                            </td>
                            <td className="px-3 py-3 text-slate-700">
                              {getAccountLabel(payment.depositTo || "")}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-slate-900">
                              Rs {Number(payment.amount || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-8 text-center text-sm text-slate-500"
                          >
                            No payment history found for this invoice.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}