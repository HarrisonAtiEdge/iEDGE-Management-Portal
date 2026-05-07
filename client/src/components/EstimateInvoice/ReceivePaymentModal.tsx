// import { Button } from "@/components/ui/button"
// import { useEffect, useMemo, useState } from "react"
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

// type PaymentRow = {
//   id: string
//   invoiceId?: string
//   client?: string
//   amount?: number
//   paymentDate?: string
//   method?: string
//   reference?: string
//   depositTo?: string
//   createdAt?: any
// }

// type InvoiceRow = {
//   id: string
//   invoiceNo?: string
//   client?: string
//   total?: number
//   balance?: number
//   status?: string
//   dueDate?: string
// }

// type MethodDetails = {
//   chequeNo: string
//   bankName: string
//   cardLast4: string
//   approvalCode: string
//   transactionId: string
//   bankReference: string
//   senderBank: string
// }

// const emptyMethodDetails: MethodDetails = {
//   chequeNo: "",
//   bankName: "",
//   cardLast4: "",
//   approvalCode: "",
//   transactionId: "",
//   bankReference: "",
//   senderBank: "",
// }

// export default function ReceivePaymentModal({ invoice, onClose }: Props) {
//   const [amount, setAmount] = useState("")
//   const [paymentDate, setPaymentDate] = useState("")
//   const [method, setMethod] = useState("")
//   const [reference, setReference] = useState("")
//   const [depositTo, setDepositTo] = useState("")
//   const [methodDetails, setMethodDetails] = useState<MethodDetails>(emptyMethodDetails)

//   const [outstandingInvoices, setOutstandingInvoices] = useState<InvoiceRow[]>([])
//   const [payments, setPayments] = useState<PaymentRow[]>([])
//   const [accounts, setAccounts] = useState<PaymentAccount[]>([])
//   const [loading, setLoading] = useState(false)

//   useEffect(() => {
//     fetchOutstanding()
//     fetchPayments()
//     loadAccounts()
//   }, [invoice?.client, invoice?.id])

//   const loadAccounts = async () => {
//     try {
//       const rows = await fetchPaymentAccounts()
//       setAccounts(rows.filter((account) => account.isActive !== false))
//     } catch (error) {
//       console.error("Failed to load payment accounts:", error)
//     }
//   }

//   const getAccountLabel = (accountId: string) => {
//     const found = accounts.find((account) => account.id === accountId)
//     if (!found) return "-"
//     return found.accountName || found.bankName || "Unnamed Account"
//   }

//   const fetchOutstanding = async () => {
//     try {
//       const q = query(
//         collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
//         where("client", "==", invoice.client),
//         where("status", "!=", "Paid")
//       )

//       const snapshot = await getDocs(q)
//       const data: InvoiceRow[] = []

//       snapshot.forEach((doc) => {
//         data.push({
//           id: doc.id,
//           ...(doc.data() as any),
//         })
//       })

//       data.sort((a, b) => {
//         const aDate = new Date(a.dueDate || 0).getTime()
//         const bDate = new Date(b.dueDate || 0).getTime()
//         return aDate - bDate
//       })

//       setOutstandingInvoices(data)
//     } catch (error) {
//       console.error("Failed to load outstanding invoices:", error)
//     }
//   }

//   const fetchPayments = async () => {
//     try {
//       const q = query(
//         collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
//         where("invoiceId", "==", invoice.id)
//       )

//       const snapshot = await getDocs(q)
//       const data: PaymentRow[] = []

//       snapshot.forEach((doc) => {
//         data.push({
//           id: doc.id,
//           ...(doc.data() as any),
//         })
//       })

//       data.sort((a, b) => {
//         const aDate = new Date(a.paymentDate || 0).getTime()
//         const bDate = new Date(b.paymentDate || 0).getTime()
//         return bDate - aDate
//       })

//       setPayments(data)
//     } catch (error) {
//       console.error("Failed to load payment history:", error)
//     }
//   }

//   const total = Number(invoice?.total || 0)
//   const currentBalance = Number(invoice?.balance ?? invoice?.total ?? 0)
//   const currentPaid = total - currentBalance

//   const enteredAmount = Number(amount || 0)
//   const projectedBalance = Math.max(currentBalance - enteredAmount, 0)
//   const projectedPaid = total - projectedBalance

//   const paidPercent = total > 0 ? ((projectedPaid / total) * 100).toFixed(1) : "0.0"
//   const remainingPercent =
//     total > 0 ? ((projectedBalance / total) * 100).toFixed(1) : "0.0"

//   const totalHistoryPaid = useMemo(() => {
//     return payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
//   }, [payments])

//   const customerOutstandingTotal = useMemo(() => {
//     return outstandingInvoices.reduce(
//       (sum, item) => sum + Number(item.balance ?? item.total ?? 0),
//       0
//     )
//   }, [outstandingInvoices])

//   const resetMethodDetails = () => {
//     setMethodDetails(emptyMethodDetails)
//   }

//   const handleMethodChange = (value: string) => {
//     setMethod(value)
//     setReference("")
//     resetMethodDetails()
//   }

//   const getReferenceLabel = () => {
//     switch (method) {
//       case "Cash":
//         return "Receipt / Reference No"
//       case "Check":
//         return "Cheque Deposit Reference"
//       case "Credit Card":
//         return "Card Payment Reference"
//       case "Direct Debit":
//         return "Direct Debit Reference"
//       case "Bank Transfer":
//         return "Transfer Reference"
//       default:
//         return "Reference No"
//     }
//   }

//   const validateMethodFields = () => {
//     if (method === "Check") {
//       if (!methodDetails.chequeNo.trim()) {
//         alert("Please enter cheque number.")
//         return false
//       }
//       if (!methodDetails.bankName.trim()) {
//         alert("Please enter bank name.")
//         return false
//       }
//     }

//     if (method === "Credit Card") {
//       if (!methodDetails.cardLast4.trim()) {
//         alert("Please enter card last 4 digits.")
//         return false
//       }
//       if (!methodDetails.approvalCode.trim()) {
//         alert("Please enter approval code.")
//         return false
//       }
//     }

//     if (method === "Direct Debit") {
//       if (!methodDetails.transactionId.trim()) {
//         alert("Please enter transaction ID.")
//         return false
//       }
//     }

//     if (method === "Bank Transfer") {
//       if (!methodDetails.bankReference.trim()) {
//         alert("Please enter bank reference.")
//         return false
//       }
//       if (!methodDetails.senderBank.trim()) {
//         alert("Please enter sender bank.")
//         return false
//       }
//     }

//     return true
//   }

//   const handleSave = async () => {
//     if (!paymentDate) {
//       alert("Please select payment date.")
//       return
//     }

//     if (!method) {
//       alert("Please select payment method.")
//       return
//     }

//     if (!amount || Number(amount) <= 0) {
//       alert("Please enter a valid payment amount.")
//       return
//     }

//     if (!depositTo) {
//       alert("Please select an account.")
//       return
//     }

//     if (Number(amount) > currentBalance) {
//       alert("Payment amount cannot be greater than remaining due.")
//       return
//     }

//     if (!validateMethodFields()) {
//       return
//     }

//     try {
//       setLoading(true)

//       const newBalance = currentBalance - Number(amount)

//       await addDoc(collection(db, "Panels", "IEDGE-SYSTEM", "payments"), {
//         invoiceId: invoice.id,
//         invoiceNo: invoice.invoiceNo || "",
//         client: invoice.client,
//         amount: Number(amount),
//         paymentDate,
//         method,
//         reference,
//         depositTo,
//         balanceAfter: newBalance,
//         methodDetails,
//         createdAt: serverTimestamp(),
//       })

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
//       alert("Failed to save payment.")
//     } finally {
//       setLoading(false)
//     }
//   }

//   const renderDynamicMethodFields = () => {
//     if (!method) return null

//     if (method === "Cash") {
//       return (
//         <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
//           Cash payment selected. No additional method details are required.
//         </div>
//       )
//     }

//     if (method === "Check") {
//       return (
//         <>
//           <div>
//             <Label>Cheque No</Label>
//             <input
//               className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//               value={methodDetails.chequeNo}
//               onChange={(e) =>
//                 setMethodDetails((prev) => ({ ...prev, chequeNo: e.target.value }))
//               }
//               placeholder="Enter cheque number"
//             />
//           </div>

//           <div>
//             <Label>Bank Name</Label>
//             <input
//               className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//               value={methodDetails.bankName}
//               onChange={(e) =>
//                 setMethodDetails((prev) => ({ ...prev, bankName: e.target.value }))
//               }
//               placeholder="Enter bank name"
//             />
//           </div>
//         </>
//       )
//     }

//     if (method === "Credit Card") {
//       return (
//         <>
//           <div>
//             <Label>Card Last 4 Digits</Label>
//             <input
//               maxLength={4}
//               className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//               value={methodDetails.cardLast4}
//               onChange={(e) =>
//                 setMethodDetails((prev) => ({
//                   ...prev,
//                   cardLast4: e.target.value.replace(/\D/g, "").slice(0, 4),
//                 }))
//               }
//               placeholder="1234"
//             />
//           </div>

//           <div>
//             <Label>Approval Code</Label>
//             <input
//               className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//               value={methodDetails.approvalCode}
//               onChange={(e) =>
//                 setMethodDetails((prev) => ({
//                   ...prev,
//                   approvalCode: e.target.value,
//                 }))
//               }
//               placeholder="Enter approval code"
//             />
//           </div>
//         </>
//       )
//     }

//     if (method === "Direct Debit") {
//       return (
//         <div className="md:col-span-2">
//           <Label>Transaction ID</Label>
//           <input
//             className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//             value={methodDetails.transactionId}
//             onChange={(e) =>
//               setMethodDetails((prev) => ({
//                 ...prev,
//                 transactionId: e.target.value,
//               }))
//             }
//             placeholder="Enter transaction ID"
//           />
//         </div>
//       )
//     }

//     if (method === "Bank Transfer") {
//       return (
//         <>
//           <div>
//             <Label>Bank Reference</Label>
//             <input
//               className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//               value={methodDetails.bankReference}
//               onChange={(e) =>
//                 setMethodDetails((prev) => ({
//                   ...prev,
//                   bankReference: e.target.value,
//                 }))
//               }
//               placeholder="Enter bank reference"
//             />
//           </div>

//           <div>
//             <Label>Sender Bank</Label>
//             <input
//               className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//               value={methodDetails.senderBank}
//               onChange={(e) =>
//                 setMethodDetails((prev) => ({
//                   ...prev,
//                   senderBank: e.target.value,
//                 }))
//               }
//               placeholder="Enter sender bank"
//             />
//           </div>
//         </>
//       )
//     }

//     return null
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
//       <div className="max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
//         <div className="border-b border-slate-200 bg-white px-6 py-5">
//           <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//             <div>
//               <h2 className="text-xl font-semibold text-slate-900">
//                 Receive Payment
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Record payment, review outstanding invoices, and track payment history.
//               </p>
//             </div>

//             <div className="flex items-center gap-2">
//               <Button variant="outline" onClick={onClose} className="rounded-xl">
//                 Close
//               </Button>
//             </div>
//           </div>
//         </div>

//         <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-6">
//           <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
//             <div className="xl:col-span-5 space-y-6">
//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <div className="mb-4">
//                   <h3 className="text-base font-semibold text-slate-900">
//                     Invoice Details
//                   </h3>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                   <div>
//                     <Label className="text-slate-500">Customer</Label>
//                     <input
//                       className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
//                       value={invoice.client || ""}
//                       readOnly
//                     />
//                   </div>

//                   <div>
//                     <Label className="text-slate-500">Invoice No</Label>
//                     <input
//                       className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
//                       value={invoice.invoiceNo || ""}
//                       readOnly
//                     />
//                   </div>

//                   <div>
//                     <Label className="text-slate-500">Email</Label>
//                     <input
//                       className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
//                       value={invoice.email || ""}
//                       readOnly
//                     />
//                   </div>

//                   <div>
//                     <Label className="text-slate-500">Invoice Total</Label>
//                     <input
//                       className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium"
//                       value={`Rs ${total.toLocaleString()}`}
//                       readOnly
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <div className="mb-4">
//                   <h3 className="text-base font-semibold text-slate-900">
//                     Payment Entry
//                   </h3>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                   <div>
//                     <Label>Payment Date</Label>
//                     <input
//                       type="date"
//                       className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//                       value={paymentDate}
//                       onChange={(e) => setPaymentDate(e.target.value)}
//                     />
//                   </div>

//                   <div>
//                     <Label>Payment Method</Label>
//                     <select
//                       className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//                       value={method}
//                       onChange={(e) => handleMethodChange(e.target.value)}
//                     >
//                       <option value="">Select Method</option>
//                       <option value="Cash">Cash</option>
//                       <option value="Check">Check</option>
//                       <option value="Credit Card">Credit Card</option>
//                       <option value="Direct Debit">Direct Debit</option>
//                       <option value="Bank Transfer">Bank Transfer</option>
//                     </select>
//                   </div>

//                   {renderDynamicMethodFields()}

//                   <div className="md:col-span-2">
//                     <Label>{getReferenceLabel()}</Label>
//                     <input
//                       className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//                       value={reference}
//                       onChange={(e) => setReference(e.target.value)}
//                       placeholder={`Enter ${getReferenceLabel().toLowerCase()}`}
//                     />
//                   </div>

//                   <div className="md:col-span-2">
//                     <Label>Deposit To (Account)</Label>
//                     <div className="mt-2">
//                       <Select value={depositTo} onValueChange={(value) => setDepositTo(value)}>
//                         <SelectTrigger className="h-11 rounded-xl border-slate-200">
//                           <SelectValue placeholder="Select account" />
//                         </SelectTrigger>

//                         <SelectContent>
//                           {accounts.length > 0 ? (
//                             accounts.map((account) => (
//                               <SelectItem key={account.id} value={account.id}>
//                                 {account.accountName || account.bankName || "Unnamed Account"}
//                               </SelectItem>
//                             ))
//                           ) : (
//                             <SelectItem value="__no_accounts__" disabled>
//                               No active accounts found
//                             </SelectItem>
//                           )}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </div>

//                   <div className="md:col-span-2">
//                     <Label>Amount Received</Label>
//                     <input
//                       type="number"
//                       className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
//                       value={amount}
//                       onChange={(e) => setAmount(e.target.value)}
//                       placeholder="Enter amount received"
//                     />
//                   </div>
//                 </div>

//                 <div className="mt-6 flex justify-end gap-3">
//                   <Button
//                     variant="outline"
//                     onClick={onClose}
//                     className="rounded-xl"
//                   >
//                     Cancel
//                   </Button>

//                   <Button
//                     onClick={handleSave}
//                     disabled={loading}
//                     className="rounded-xl"
//                   >
//                     {loading ? "Saving..." : "Save Payment"}
//                   </Button>
//                 </div>
//               </div>
//             </div>

//             <div className="xl:col-span-7 space-y-6">
//               <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//                 <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                   <div className="text-sm text-slate-500">Amount Due</div>
//                   <div className="mt-2 text-2xl font-semibold text-slate-900">
//                     Rs {total.toLocaleString()}
//                   </div>
//                 </div>

//                 <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                   <div className="text-sm text-slate-500">Paid So Far</div>
//                   <div className="mt-2 text-2xl font-semibold text-emerald-600">
//                     Rs {currentPaid.toLocaleString()}
//                   </div>
//                 </div>

//                 <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                   <div className="text-sm text-slate-500">Remaining Due</div>
//                   <div className="mt-2 text-2xl font-semibold text-rose-600">
//                     Rs {currentBalance.toLocaleString()}
//                   </div>
//                 </div>

//                 <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                   <div className="text-sm text-slate-500">Status</div>
//                   <div className="mt-2 text-sm font-medium text-slate-900">
//                     Paid: {paidPercent}% | Remaining: {remainingPercent}%
//                   </div>
//                   <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
//                     <div
//                       className="h-full rounded-full bg-slate-900 transition-all"
//                       style={{ width: `${paidPercent}%` }}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="text-base font-semibold text-slate-900">
//                     Payment Summary
//                   </h3>
//                   <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
//                     Live Preview
//                   </span>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <div className="text-xs uppercase tracking-wide text-slate-500">
//                       Entered Payment
//                     </div>
//                     <div className="mt-2 text-xl font-semibold text-slate-900">
//                       Rs {enteredAmount.toLocaleString()}
//                     </div>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <div className="text-xs uppercase tracking-wide text-slate-500">
//                       Balance After Payment
//                     </div>
//                     <div className="mt-2 text-xl font-semibold text-slate-900">
//                       Rs {projectedBalance.toLocaleString()}
//                     </div>
//                   </div>

//                   <div className="rounded-xl bg-slate-50 p-4">
//                     <div className="text-xs uppercase tracking-wide text-slate-500">
//                       Payment Type
//                     </div>
//                     <div className="mt-2 text-xl font-semibold text-slate-900">
//                       {enteredAmount > 0 && projectedBalance > 0
//                         ? "Partial Payment"
//                         : enteredAmount > 0 && projectedBalance <= 0
//                         ? "Full Payment"
//                         : "Not Entered"}
//                     </div>
//                   </div>
//                 </div>

//                 {enteredAmount > 0 && projectedBalance > 0 ? (
//                   <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
//                     Partial payment detected. Remaining due after this payment will be{" "}
//                     <span className="font-semibold">
//                       Rs {projectedBalance.toLocaleString()}
//                     </span>
//                     .
//                   </div>
//                 ) : null}
//               </div>

//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="text-base font-semibold text-slate-900">
//                     Outstanding Invoices
//                   </h3>
//                   <span className="text-sm text-slate-500">
//                     Total Outstanding: Rs {customerOutstandingTotal.toLocaleString()}
//                   </span>
//                 </div>

//                 <div className="overflow-x-auto">
//                   <table className="min-w-[680px] w-full text-sm">
//                     <thead>
//                       <tr className="border-b border-slate-200 text-slate-500">
//                         <th className="px-3 py-3 text-left font-medium">Invoice No</th>
//                         <th className="px-3 py-3 text-left font-medium">Status</th>
//                         <th className="px-3 py-3 text-left font-medium">Due Date</th>
//                         <th className="px-3 py-3 text-right font-medium">Total</th>
//                         <th className="px-3 py-3 text-right font-medium">Balance</th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {outstandingInvoices.length > 0 ? (
//                         outstandingInvoices.map((item) => (
//                           <tr key={item.id} className="border-b border-slate-100">
//                             <td className="px-3 py-3 text-slate-700">
//                               {item.invoiceNo || "-"}
//                             </td>
//                             <td className="px-3 py-3">
//                               <span
//                                 className={`rounded-full px-2.5 py-1 text-xs font-medium ${
//                                   item.status === "Partially Paid"
//                                     ? "bg-amber-50 text-amber-700"
//                                     : item.status === "Paid"
//                                     ? "bg-emerald-50 text-emerald-700"
//                                     : "bg-rose-50 text-rose-700"
//                                 }`}
//                               >
//                                 {item.status || "Unpaid"}
//                               </span>
//                             </td>
//                             <td className="px-3 py-3 text-slate-700">
//                               {item.dueDate || "-"}
//                             </td>
//                             <td className="px-3 py-3 text-right text-slate-700">
//                               Rs {Number(item.total || 0).toLocaleString()}
//                             </td>
//                             <td className="px-3 py-3 text-right font-semibold text-slate-900">
//                               Rs {Number(item.balance ?? item.total ?? 0).toLocaleString()}
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td
//                             colSpan={5}
//                             className="px-3 py-8 text-center text-sm text-slate-500"
//                           >
//                             No outstanding invoices found for this customer.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//                 <div className="mb-4 flex items-center justify-between">
//                   <h3 className="text-base font-semibold text-slate-900">
//                     Payment History
//                   </h3>
//                   <span className="text-sm text-slate-500">
//                     Total Received: Rs {totalHistoryPaid.toLocaleString()}
//                   </span>
//                 </div>

//                 <div className="overflow-x-auto">
//                   <table className="min-w-[760px] w-full text-sm">
//                     <thead>
//                       <tr className="border-b border-slate-200 text-slate-500">
//                         <th className="px-3 py-3 text-left font-medium">Date</th>
//                         <th className="px-3 py-3 text-left font-medium">Method</th>
//                         <th className="px-3 py-3 text-left font-medium">Reference</th>
//                         <th className="px-3 py-3 text-left font-medium">Account</th>
//                         <th className="px-3 py-3 text-right font-medium">Amount</th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {payments.length > 0 ? (
//                         payments.map((payment) => (
//                           <tr key={payment.id} className="border-b border-slate-100">
//                             <td className="px-3 py-3 text-slate-700">
//                               {payment.paymentDate || "-"}
//                             </td>
//                             <td className="px-3 py-3 text-slate-700">
//                               {payment.method || "-"}
//                             </td>
//                             <td className="px-3 py-3 text-slate-700">
//                               {payment.reference || "-"}
//                             </td>
//                             <td className="px-3 py-3 text-slate-700">
//                               {getAccountLabel(payment.depositTo || "")}
//                             </td>
//                             <td className="px-3 py-3 text-right font-semibold text-slate-900">
//                               Rs {Number(payment.amount || 0).toLocaleString()}
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td
//                             colSpan={5}
//                             className="px-3 py-8 text-center text-sm text-slate-500"
//                           >
//                             No payment history found for this invoice.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchPaymentAccounts } from "@/lib/payments/paymentAccounts";
import { PaymentAccount } from "@/lib/payments/types";

type Props = {
  invoice: any;
  onClose: () => void;
};

type PaymentRow = {
  id: string;
  invoiceId?: string;
  client?: string;
  amount?: number;
  totalPayment?: number;
  whtValue?: number;
  whtMode?: DeductionMode;
  whtAmount?: number;
  sstValue?: number;
  sstMode?: DeductionMode;
  sstAmount?: number;
  totalTaxDeduction?: number;
  receivedAmount?: number;
  paymentDate?: string;
  method?: string;
  reference?: string;
  depositTo?: string;
  createdAt?: any;
};

type InvoiceRow = {
  id: string;
  invoiceNo?: string;
  client?: string;
  total?: number;
  balance?: number;
  status?: string;
  dueDate?: string;
};

type MethodDetails = {
  chequeNo: string;
  bankName: string;
  cardLast4: string;
  approvalCode: string;
  transactionId: string;
  bankReference: string;
  senderBank: string;
};

const emptyMethodDetails: MethodDetails = {
  chequeNo: "",
  bankName: "",
  cardLast4: "",
  approvalCode: "",
  transactionId: "",
  bankReference: "",
  senderBank: "",
};

type DeductionMode = "percentage" | "fixed";

const toPositiveNumber = (value: string | number | undefined) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const pickNumber = (...values: Array<string | number | undefined | null>) => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;

    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const calculateDeduction = (
  value: string,
  mode: DeductionMode,
  baseAmount: number,
) => {
  const numericValue = toPositiveNumber(value);

  if (!numericValue || !baseAmount) return 0;

  if (mode === "percentage") {
    return (baseAmount * numericValue) / 100;
  }

  return numericValue;
};

const formatAmount = (value: any) => {
  return Number(Number(value || 0).toFixed(2));
};

const formatAmountText = (value: any) => {
  return `Rs ${Number(value || 0).toLocaleString()}`;
};

const cleanFileName = (value: string) => {
  return String(value || "receive-payment-report")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
};

export default function ReceivePaymentModal({ invoice, onClose }: Props) {
  const [amount, setAmount] = useState("");
  const [whtValue, setWhtValue] = useState("");
  const [whtMode, setWhtMode] = useState<DeductionMode>("percentage");
  const [sstValue, setSstValue] = useState("");
  const [sstMode, setSstMode] = useState<DeductionMode>("percentage");
  const [paymentDate, setPaymentDate] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [depositTo, setDepositTo] = useState("");
  const [methodDetails, setMethodDetails] =
    useState<MethodDetails>(emptyMethodDetails);

  const [outstandingInvoices, setOutstandingInvoices] = useState<InvoiceRow[]>(
    [],
  );
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(invoice || {});
  const [outstandingPage, setOutstandingPage] = useState(1);

  const OUTSTANDING_PAGE_SIZE = 5;

  useEffect(() => {
    fetchInvoiceDetails();
    fetchOutstanding();
    fetchPayments();
    loadAccounts();
  }, [invoice?.client, invoice?.id]);

  useEffect(() => {
    setOutstandingPage(1);
  }, [invoice?.id, invoice?.client]);

  const fetchInvoiceDetails = async () => {
    try {
      if (!invoice?.id) {
        setInvoiceDetails(invoice || {});
        return;
      }

      const invoiceRef = doc(
        db,
        "Panels",
        "IEDGE-SYSTEM",
        "estimateInvoices",
        invoice.id,
      );

      const invoiceSnap = await getDoc(invoiceRef);

      if (invoiceSnap.exists()) {
        setInvoiceDetails({
          id: invoiceSnap.id,
          ...invoiceSnap.data(),
        });
      } else {
        setInvoiceDetails(invoice || {});
      }
    } catch (error) {
      console.error("Failed to fetch invoice details:", error);
      setInvoiceDetails(invoice || {});
    }
  };

  const loadAccounts = async () => {
    try {
      const rows = await fetchPaymentAccounts();
      setAccounts(rows.filter((account) => account.isActive !== false));
    } catch (error) {
      console.error("Failed to load payment accounts:", error);
    }
  };

  const getAccountLabel = (accountId: string) => {
    const found = accounts.find((account) => account.id === accountId);
    if (!found) return "-";
    return found.accountName || found.bankName || "Unnamed Account";
  };

  const fetchOutstanding = async () => {
    try {
      const q = query(
        collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
        where("client", "==", invoice.client),
        where("status", "!=", "Paid"),
      );

      const snapshot = await getDocs(q);
      const data: InvoiceRow[] = [];

      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...(doc.data() as any),
        });
      });

      data.sort((a, b) => {
        const aDate = new Date(a.dueDate || 0).getTime();
        const bDate = new Date(b.dueDate || 0).getTime();
        return aDate - bDate;
      });

      setOutstandingInvoices(data);
    } catch (error) {
      console.error("Failed to load outstanding invoices:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const q = query(
        collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
        where("invoiceId", "==", invoice.id),
      );

      const snapshot = await getDocs(q);
      const data: PaymentRow[] = [];

      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...(doc.data() as any),
        });
      });

      data.sort((a, b) => {
        const aDate = new Date(a.paymentDate || 0).getTime();
        const bDate = new Date(b.paymentDate || 0).getTime();
        return bDate - aDate;
      });

      setPayments(data);
    } catch (error) {
      console.error("Failed to load payment history:", error);
    }
  };

  // const total = Number(invoice?.total || 0)
  // const totalPayment = toPositiveNumber(amount)
  // const whtDeduction = calculateDeduction(whtValue, whtMode, totalPayment)
  // const sstDeduction = calculateDeduction(sstValue, sstMode, totalPayment)
  // const totalTaxDeduction = whtDeduction + sstDeduction
  // const receivedAmount = Math.max(totalPayment - totalTaxDeduction, 0)
  // const projectedBalance = Math.max(total - receivedAmount, 0)
  // const projectedPaid = receivedAmount

  // const paidPercent = total > 0 ? ((projectedPaid / total) * 100).toFixed(1) : "0.0"
  // const remainingPercent =
  //   total > 0 ? ((projectedBalance / total) * 100).toFixed(1) : "0.0"

  // ========================= FIXED PAYMENT CALCULATION =========================

  // const total = Number(invoice?.total || 0)
  const invoiceRecord = invoiceDetails || invoice || {};

  const total = pickNumber(invoiceRecord?.total, invoice?.total);

  const rawTaxAmount = pickNumber(
    invoiceRecord?.taxAmount,
    invoiceRecord?.totalTax,
    invoiceRecord?.tax,
    invoiceRecord?.salesTaxAmount,
    invoiceRecord?.gstAmount,
    invoiceRecord?.vatAmount,
    invoiceRecord?.sstAmount,
    invoiceRecord?.summary?.taxAmount,
    invoiceRecord?.totals?.taxAmount,
  );

  const rawAmountExcludingTax = pickNumber(
    invoiceRecord?.amountExcludingTax,
    invoiceRecord?.invoiceAmountExcludingTax,
    invoiceRecord?.totalExcludingTax,
    invoiceRecord?.subtotal,
    invoiceRecord?.subTotal,
    invoiceRecord?.totalBeforeTax,
    invoiceRecord?.netAmount,
    invoiceRecord?.baseAmount,
    invoiceRecord?.summary?.subtotal,
    invoiceRecord?.totals?.subtotal,
  );

  const invoiceTaxAmount = Number(
    (rawTaxAmount || Math.max(total - rawAmountExcludingTax, 0)).toFixed(2),
  );

  const invoiceAmountExcludingTax = Number(
    (rawAmountExcludingTax || Math.max(total - invoiceTaxAmount, 0)).toFixed(2),
  );

  // Current entered payment
  const totalPayment = toPositiveNumber(amount);

  // Previous FULL payments
  const previousPaidAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.totalPayment ?? payment.amount ?? 0),
    0,
  );

  // Deductions
  const whtDeduction = calculateDeduction(whtValue, whtMode, totalPayment);

  const sstDeduction = calculateDeduction(sstValue, sstMode, totalPayment);

  // Total deduction
  const totalTaxDeduction = whtDeduction + sstDeduction;

  // NET received after deduction
  // ONLY FOR DISPLAY
  const receivedAmount = Math.max(totalPayment - totalTaxDeduction, 0);

  // IMPORTANT FIX
  // Remaining should reduce by FULL PAYMENT
  const totalPaidIncludingCurrent = Number(
    (previousPaidAmount + totalPayment).toFixed(2),
  );

  const projectedBalance = Math.max(
    Number((total - totalPaidIncludingCurrent).toFixed(2)),
    0,
  );

  // PAID %
  const projectedPaid = totalPaidIncludingCurrent;

  const paidPercent =
    total > 0 ? ((projectedPaid / total) * 100).toFixed(1) : "0.0";

  // REMAINING %
  const remainingPercent =
    total > 0 ? ((projectedBalance / total) * 100).toFixed(1) : "0.0";

  // ============================================================================

  const totalHistoryPaid = useMemo(() => {
    return Number(
      payments
        .reduce(
          (sum, payment) =>
            sum + Number(payment.totalPayment ?? payment.amount ?? 0),
          0,
        )
        .toFixed(2),
    );
  }, [payments]);

  const outstandingTotalPages = Math.max(
    1,
    Math.ceil(outstandingInvoices.length / OUTSTANDING_PAGE_SIZE),
  );

  const safeOutstandingPage = Math.min(outstandingPage, outstandingTotalPages);

  const paginatedOutstandingInvoices = useMemo(() => {
    const startIndex = (safeOutstandingPage - 1) * OUTSTANDING_PAGE_SIZE;

    return outstandingInvoices.slice(
      startIndex,
      startIndex + OUTSTANDING_PAGE_SIZE,
    );
  }, [outstandingInvoices, safeOutstandingPage]);

  const outstandingStartItem =
    outstandingInvoices.length > 0
      ? (safeOutstandingPage - 1) * OUTSTANDING_PAGE_SIZE + 1
      : 0;

  const outstandingEndItem = Math.min(
    safeOutstandingPage * OUTSTANDING_PAGE_SIZE,
    outstandingInvoices.length,
  );

  const customerOutstandingTotal = useMemo(() => {
    return outstandingInvoices.reduce(
      (sum, item) => sum + Number(item.balance ?? item.total ?? 0),
      0,
    );
  }, [outstandingInvoices]);

  const resetMethodDetails = () => {
    setMethodDetails(emptyMethodDetails);
  };

  const handleMethodChange = (value: string) => {
    setMethod(value);
    setReference("");
    resetMethodDetails();
  };

  const getReferenceLabel = () => {
    switch (method) {
      case "Cash":
        return "Receipt / Reference No";
      case "Check":
        return "Cheque Deposit Reference";
      case "Credit Card":
        return "Card Payment Reference";
      case "Direct Debit":
        return "Direct Debit Reference";
      case "Bank Transfer":
        return "Transfer Reference";
      default:
        return "Reference No";
    }
  };

  const validateMethodFields = () => {
    if (method === "Check") {
      if (!methodDetails.chequeNo.trim()) {
        alert("Please enter cheque number.");
        return false;
      }
      if (!methodDetails.bankName.trim()) {
        alert("Please enter bank name.");
        return false;
      }
    }

    if (method === "Credit Card") {
      if (!methodDetails.cardLast4.trim()) {
        alert("Please enter card last 4 digits.");
        return false;
      }
      if (!methodDetails.approvalCode.trim()) {
        alert("Please enter approval code.");
        return false;
      }
    }

    if (method === "Direct Debit") {
      if (!methodDetails.transactionId.trim()) {
        alert("Please enter transaction ID.");
        return false;
      }
    }

    if (method === "Bank Transfer") {
      if (!methodDetails.bankReference.trim()) {
        alert("Please enter bank reference.");
        return false;
      }
      if (!methodDetails.senderBank.trim()) {
        alert("Please enter sender bank.");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!paymentDate) {
      alert("Please select payment date.");
      return;
    }

    if (!method) {
      alert("Please select payment method.");
      return;
    }

    if (!amount || totalPayment <= 0) {
      alert("Please enter a valid total payment amount.");
      return;
    }

    if (!depositTo) {
      alert("Please select an account.");
      return;
    }

    if (totalPayment > total) {
      alert("Total payment cannot be greater than invoice total.");
      return;
    }

    if (totalTaxDeduction >= totalPayment) {
      alert(
        "WHT and SST deductions cannot be equal to or greater than the total payment.",
      );
      return;
    }

    if (receivedAmount <= 0) {
      alert(
        "Received amount after WHT/SST deduction must be greater than zero.",
      );
      return;
    }

    if (!validateMethodFields()) {
      return;
    }

    try {
      setLoading(true);

      // const newBalance = Math.max(total - receivedAmount, 0)

      const previousPaidAmount = payments.reduce(
        (sum, payment) =>
          sum + Number(payment.totalPayment ?? payment.amount ?? 0),
        0,
      );

      const totalPaidIncludingCurrent = previousPaidAmount + totalPayment;

      const newBalance = Math.max(total - totalPaidIncludingCurrent, 0);

      await addDoc(collection(db, "Panels", "IEDGE-SYSTEM", "payments"), {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo || "",
        client: invoice.client,
        amount: totalPayment,
        totalPayment,
        whtValue: toPositiveNumber(whtValue),
        whtMode,
        whtAmount: whtDeduction,
        sstValue: toPositiveNumber(sstValue),
        sstMode,
        sstAmount: sstDeduction,
        totalTaxDeduction,
        receivedAmount,
        paymentDate,
        method,
        reference,
        depositTo,
        balanceAfter: newBalance,
        methodDetails,
        createdAt: serverTimestamp(),
      });

      await updateDoc(
        doc(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices", invoice.id),
        {
          balance: newBalance,
          status: newBalance <= 0 ? "Paid" : "Partially Paid",
        },
      );

      onClose();
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Failed to save payment.");
    } finally {
      setLoading(false);
    }
  };

  const exportStatus =
    projectedBalance <= 0
      ? "Paid"
      : projectedPaid > 0
        ? "Partially Paid"
        : "Unpaid";

  const getInvoiceDetailsRows = () => {
    return [
      {
        Field: "Customer",
        Value: invoiceRecord.client || "-",
      },
      {
        Field: "Invoice No",
        Value: invoiceRecord.invoiceNo || invoice?.invoiceNo || "-",
      },
      {
        Field: "Email",
        Value: invoiceRecord.email || "-",
      },
      {
        Field: "Invoice Amount Excluding Tax",
        Value: formatAmount(invoiceAmountExcludingTax),
      },
      {
        Field: "Tax Amount",
        Value: formatAmount(invoiceTaxAmount),
      },
      {
        Field: "Invoice Total Inclusive of Tax",
        Value: formatAmount(total),
      },
    ];
  };

  const getStatusSummaryRows = () => {
    return [
      {
        Field: "Amount Due",
        Value: formatAmount(total),
      },
      {
        Field: "Paid So Far",
        Value: formatAmount(projectedPaid),
      },
      {
        Field: "Remaining Due",
        Value: formatAmount(projectedBalance),
      },
      {
        Field: "Status",
        Value: exportStatus,
      },
      {
        Field: "Paid %",
        Value: `${paidPercent}%`,
      },
      {
        Field: "Remaining %",
        Value: `${remainingPercent}%`,
      },
    ];
  };

  const getPaymentEntryRows = () => {
    return [
      {
        Field: "Payment Date",
        Value: paymentDate || "-",
      },
      {
        Field: "Payment Method",
        Value: method || "-",
      },
      {
        Field: getReferenceLabel(),
        Value: reference || "-",
      },
      {
        Field: "Deposit To Account",
        Value: depositTo ? getAccountLabel(depositTo) : "-",
      },
      {
        Field: "Total Payment",
        Value: formatAmount(totalPayment),
      },
      {
        Field: "WHT Mode",
        Value: whtMode === "percentage" ? "%" : "Fixed",
      },
      {
        Field: "WHT Value",
        Value: whtValue || "0",
      },
      {
        Field: "WHT Deduction",
        Value: formatAmount(whtDeduction),
      },
      {
        Field: "SST Mode",
        Value: sstMode === "percentage" ? "%" : "Fixed",
      },
      {
        Field: "SST Value",
        Value: sstValue || "0",
      },
      {
        Field: "SST Deduction",
        Value: formatAmount(sstDeduction),
      },
      {
        Field: "Total WHT/SST Deduction",
        Value: formatAmount(totalTaxDeduction),
      },
      {
        Field: "Received Amount After Deduction",
        Value: formatAmount(receivedAmount),
      },
      {
        Field: "Cheque No",
        Value: methodDetails.chequeNo || "-",
      },
      {
        Field: "Bank Name",
        Value: methodDetails.bankName || "-",
      },
      {
        Field: "Card Last 4 Digits",
        Value: methodDetails.cardLast4 || "-",
      },
      {
        Field: "Approval Code",
        Value: methodDetails.approvalCode || "-",
      },
      {
        Field: "Transaction ID",
        Value: methodDetails.transactionId || "-",
      },
      {
        Field: "Bank Reference",
        Value: methodDetails.bankReference || "-",
      },
      {
        Field: "Sender Bank",
        Value: methodDetails.senderBank || "-",
      },
    ];
  };

  const getPaymentHistoryRows = () => {
    return payments.map((payment, index) => ({
      "#": index + 1,
      Date: payment.paymentDate || "-",
      Method: payment.method || "-",
      Reference: payment.reference || "-",
      Account: getAccountLabel(payment.depositTo || ""),
      "Total Payment": formatAmount(
        payment.totalPayment ?? payment.amount ?? 0,
      ),
      WHT: formatAmount(payment.whtAmount || 0),
      SST: formatAmount(payment.sstAmount || 0),
      "Total Deduction": formatAmount(payment.totalTaxDeduction || 0),
      "Received After Deduction": formatAmount(
        payment.receivedAmount ?? payment.amount ?? 0,
      ),
    }));
  };

  const getOutstandingRows = () => {
    return outstandingInvoices.map((item, index) => ({
      "#": index + 1,
      "Invoice No": item.invoiceNo || "-",
      Customer: item.client || invoiceRecord.client || "-",
      Status: item.status || "Unpaid",
      "Due Date": item.dueDate || "-",
      Total: formatAmount(item.total || 0),
      Balance: formatAmount(item.balance ?? item.total ?? 0),
    }));
  };

  const handleExportExcel = () => {
    const fileName = cleanFileName(
      `Receive-Payment-${invoiceRecord.invoiceNo || invoice?.invoiceNo || "Invoice"}`,
    );

    const workbook = XLSX.utils.book_new();

    const invoiceSheet = XLSX.utils.json_to_sheet(getInvoiceDetailsRows());
    const statusSheet = XLSX.utils.json_to_sheet(getStatusSummaryRows());
    const paymentEntrySheet = XLSX.utils.json_to_sheet(getPaymentEntryRows());
    const paymentHistorySheet = XLSX.utils.json_to_sheet(
      getPaymentHistoryRows().length
        ? getPaymentHistoryRows()
        : [
            {
              "#": "-",
              Date: "No payment history found",
              Method: "-",
              Reference: "-",
              Account: "-",
              "Total Payment": 0,
              WHT: 0,
              SST: 0,
              "Total Deduction": 0,
              "Received After Deduction": 0,
            },
          ],
    );
    const outstandingSheet = XLSX.utils.json_to_sheet(
      getOutstandingRows().length
        ? getOutstandingRows()
        : [
            {
              "#": "-",
              "Invoice No": "No outstanding invoices found",
              Customer: "-",
              Status: "-",
              "Due Date": "-",
              Total: 0,
              Balance: 0,
            },
          ],
    );

    XLSX.utils.book_append_sheet(workbook, invoiceSheet, "Invoice Details");
    XLSX.utils.book_append_sheet(workbook, statusSheet, "Amount Status");
    XLSX.utils.book_append_sheet(workbook, paymentEntrySheet, "Payment Entry");
    XLSX.utils.book_append_sheet(
      workbook,
      paymentHistorySheet,
      "Payment History",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      outstandingSheet,
      "Outstanding Invoices",
    );

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const handleExportPdf = () => {
    const fileName = cleanFileName(
      `Receive-Payment-${invoiceRecord.invoiceNo || invoice?.invoiceNo || "Invoice"}`,
    );

    const pdf = new jsPDF("p", "mm", "a4");

    pdf.setFontSize(16);
    pdf.text("Receive Payment Report", 14, 16);

    pdf.setFontSize(10);
    pdf.text(`Customer: ${invoiceRecord.client || "-"}`, 14, 26);
    pdf.text(
      `Invoice No: ${invoiceRecord.invoiceNo || invoice?.invoiceNo || "-"}`,
      14,
      32,
    );
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

    autoTable(pdf, {
      startY: 46,
      head: [["Invoice Details", "Value"]],
      body: [
        ["Customer", invoiceRecord.client || "-"],
        ["Invoice No", invoiceRecord.invoiceNo || invoice?.invoiceNo || "-"],
        ["Email", invoiceRecord.email || "-"],
        [
          "Invoice Amount Excluding Tax",
          formatAmountText(invoiceAmountExcludingTax),
        ],
        ["Tax Amount", formatAmountText(invoiceTaxAmount)],
        ["Invoice Total Inclusive of Tax", formatAmountText(total)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    let nextY = (pdf as any).lastAutoTable.finalY + 8;

    autoTable(pdf, {
      startY: nextY,
      head: [["Amount / Status", "Value"]],
      body: [
        ["Amount Due", formatAmountText(total)],
        ["Paid So Far", formatAmountText(projectedPaid)],
        ["Remaining Due", formatAmountText(projectedBalance)],
        ["Status", exportStatus],
        ["Paid %", `${paidPercent}%`],
        ["Remaining %", `${remainingPercent}%`],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    nextY = (pdf as any).lastAutoTable.finalY + 8;

    autoTable(pdf, {
      startY: nextY,
      head: [["Payment Entry", "Value"]],
      body: [
        ["Payment Date", paymentDate || "-"],
        ["Payment Method", method || "-"],
        [getReferenceLabel(), reference || "-"],
        ["Deposit To Account", depositTo ? getAccountLabel(depositTo) : "-"],
        ["Total Payment", formatAmountText(totalPayment)],
        ["WHT Mode", whtMode === "percentage" ? "%" : "Fixed"],
        ["WHT Value", whtValue || "0"],
        ["WHT Deduction", formatAmountText(whtDeduction)],
        ["SST Mode", sstMode === "percentage" ? "%" : "Fixed"],
        ["SST Value", sstValue || "0"],
        ["SST Deduction", formatAmountText(sstDeduction)],
        ["Total WHT/SST Deduction", formatAmountText(totalTaxDeduction)],
        ["Received Amount After Deduction", formatAmountText(receivedAmount)],
        ["Cheque No", methodDetails.chequeNo || "-"],
        ["Bank Name", methodDetails.bankName || "-"],
        ["Card Last 4 Digits", methodDetails.cardLast4 || "-"],
        ["Approval Code", methodDetails.approvalCode || "-"],
        ["Transaction ID", methodDetails.transactionId || "-"],
        ["Bank Reference", methodDetails.bankReference || "-"],
        ["Sender Bank", methodDetails.senderBank || "-"],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    nextY = (pdf as any).lastAutoTable.finalY + 8;

    if (nextY > 240) {
      pdf.addPage();
      nextY = 16;
    }

    pdf.setFontSize(13);
    pdf.text("Payment History", 14, nextY);

    autoTable(pdf, {
      startY: nextY + 5,
      head: [
        [
          "#",
          "Date",
          "Method",
          "Reference",
          "Account",
          "Total Payment",
          "WHT",
          "SST",
          "Received",
        ],
      ],
      body:
        payments.length > 0
          ? payments.map((payment, index) => [
              index + 1,
              payment.paymentDate || "-",
              payment.method || "-",
              payment.reference || "-",
              getAccountLabel(payment.depositTo || ""),
              formatAmountText(payment.totalPayment ?? payment.amount ?? 0),
              formatAmountText(payment.whtAmount || 0),
              formatAmountText(payment.sstAmount || 0),
              formatAmountText(payment.receivedAmount ?? payment.amount ?? 0),
            ])
          : [
              [
                "-",
                "No payment history found",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
              ],
            ],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    nextY = (pdf as any).lastAutoTable.finalY + 8;

    if (nextY > 240) {
      pdf.addPage();
      nextY = 16;
    }

    pdf.setFontSize(13);
    pdf.text("Outstanding Invoices", 14, nextY);

    autoTable(pdf, {
      startY: nextY + 5,
      head: [
        [
          "#",
          "Invoice No",
          "Customer",
          "Status",
          "Due Date",
          "Total",
          "Balance",
        ],
      ],
      body:
        outstandingInvoices.length > 0
          ? outstandingInvoices.map((item, index) => [
              index + 1,
              item.invoiceNo || "-",
              item.client || invoiceRecord.client || "-",
              item.status || "Unpaid",
              item.dueDate || "-",
              formatAmountText(item.total || 0),
              formatAmountText(item.balance ?? item.total ?? 0),
            ])
          : [["-", "No outstanding invoices found", "-", "-", "-", "-", "-"]],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [15, 23, 42] },
    });

    pdf.save(`${fileName}.pdf`);
  };

  const renderDynamicMethodFields = () => {
    if (!method) return null;

    if (method === "Cash") {
      return (
        <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Cash payment selected. No additional method details are required.
        </div>
      );
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
                setMethodDetails((prev) => ({
                  ...prev,
                  chequeNo: e.target.value,
                }))
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
                setMethodDetails((prev) => ({
                  ...prev,
                  bankName: e.target.value,
                }))
              }
              placeholder="Enter bank name"
            />
          </div>
        </>
      );
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
      );
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
      );
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
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Receive Payment
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Record payment, review outstanding invoices, and track payment
                history.
              </p>
            </div>

            {/* <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Close
              </Button>
            </div> */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportExcel}
                className="rounded-xl"
              >
                Export Excel
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleExportPdf}
                className="rounded-xl"
              >
                Export PDF
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl"
              >
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

                {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                </div> */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-slate-500">Customer</Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
                      value={invoiceRecord.client || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label className="text-slate-500">Invoice No</Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
                      value={invoiceRecord.invoiceNo || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label className="text-slate-500">Email</Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
                      value={invoiceRecord.email || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label className="text-slate-500">
                      Invoice Amount Excluding Tax
                    </Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium"
                      value={`Rs ${invoiceAmountExcludingTax.toLocaleString()}`}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label className="text-slate-500">Tax Amount</Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium"
                      value={`Rs ${invoiceTaxAmount.toLocaleString()}`}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label className="text-slate-500">
                      Invoice Total Inclusive of Tax
                    </Label>
                    <input
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold"
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
                      <Select
                        value={depositTo}
                        onValueChange={(value) => setDepositTo(value)}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-slate-200">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>

                        <SelectContent>
                          {accounts.length > 0 ? (
                            accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.accountName ||
                                  account.bankName ||
                                  "Unnamed Account"}
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
                    <Label>Total Payment</Label>
                    <input
                      type="number"
                      min="0"
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter total payment before WHT/SST deduction"
                    />
                  </div>

                  <div>
                    <Label>WHT (Withholding Tax)</Label>
                    <div className="mt-2 flex gap-2">
                      <select
                        className="h-11 w-32 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                        value={whtMode}
                        onChange={(e) =>
                          setWhtMode(e.target.value as DeductionMode)
                        }
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">Fixed</option>
                      </select>

                      <input
                        type="number"
                        min="0"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                        value={whtValue}
                        onChange={(e) => setWhtValue(e.target.value)}
                        placeholder={
                          whtMode === "percentage"
                            ? "Enter WHT %"
                            : "Enter WHT amount"
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label>SST (20%)</Label>
                    <div className="mt-2 flex gap-2">
                      <select
                        className="h-11 w-32 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                        value={sstMode}
                        onChange={(e) =>
                          setSstMode(e.target.value as DeductionMode)
                        }
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">Fixed</option>
                      </select>

                      <input
                        type="number"
                        min="0"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                        value={sstValue}
                        onChange={(e) => setSstValue(e.target.value)}
                        placeholder={
                          sstMode === "percentage"
                            ? "Enter 20 for 20% SST"
                            : "Enter SST amount"
                        }
                      />
                    </div>
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
                    Rs {projectedPaid.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-slate-500">Remaining Due</div>
                  <div className="mt-2 text-2xl font-semibold text-rose-600">
                    Rs {projectedBalance.toLocaleString()}
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Total Payment
                    </div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      Rs {totalPayment.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      WHT Deduction
                    </div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      Rs {whtDeduction.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      SST Deduction
                    </div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      Rs {sstDeduction.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Received Amount After Deduction
                    </div>
                    <div className="mt-2 text-xl font-semibold text-emerald-600">
                      Rs {receivedAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {totalPayment > 0 ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    Payment type:{" "}
                    {receivedAmount > 0 && projectedBalance > 0
                      ? "Partial Payment"
                      : receivedAmount > 0 && projectedBalance <= 0
                        ? "Full Payment"
                        : "Not Entered"}
                    {totalTaxDeduction > 0 ? (
                      <>
                        {" "}
                        — total WHT/SST deduction is{" "}
                        <span className="font-semibold">
                          Rs {totalTaxDeduction.toLocaleString()}
                        </span>
                        , so actual received amount is{" "}
                        <span className="font-semibold">
                          Rs {receivedAmount.toLocaleString()}
                        </span>
                        .
                      </>
                    ) : null}
                  </div>
                ) : null}

                {receivedAmount > 0 && projectedBalance > 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Partial payment detected. Remaining due after this payment
                    will be{" "}
                    <span className="font-semibold">
                      Rs {projectedBalance.toLocaleString()}
                    </span>
                    .
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Outstanding Invoices
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Showing {outstandingStartItem} to {outstandingEndItem} of{" "}
                      {outstandingInvoices.length} invoices
                    </p>
                  </div>

                  <span className="text-sm text-slate-500">
                    Total Outstanding: Rs{" "}
                    {customerOutstandingTotal.toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[680px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-3 text-left font-medium">
                          Invoice No
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Due Date
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Total
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Balance
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {outstandingInvoices.length > 0 ? (
                        paginatedOutstandingInvoices.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100"
                          >
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
                              Rs{" "}
                              {Number(
                                item.balance ?? item.total ?? 0,
                              ).toLocaleString()}
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

                {outstandingInvoices.length > OUTSTANDING_PAGE_SIZE ? (
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-slate-500">
                      Page {safeOutstandingPage} of {outstandingTotalPages}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={safeOutstandingPage <= 1}
                        onClick={() =>
                          setOutstandingPage((prev) => Math.max(prev - 1, 1))
                        }
                      >
                        Previous
                      </Button>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        {safeOutstandingPage}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={safeOutstandingPage >= outstandingTotalPages}
                        onClick={() =>
                          setOutstandingPage((prev) =>
                            Math.min(prev + 1, outstandingTotalPages),
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
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
                  <table className="min-w-[980px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-3 text-left font-medium">
                          Date
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Method
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Reference
                        </th>
                        <th className="px-3 py-3 text-left font-medium">
                          Account
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Total Payment
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          WHT
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          SST
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Received
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {payments.length > 0 ? (
                        payments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="border-b border-slate-100"
                          >
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
                            <td className="px-3 py-3 text-right text-slate-700">
                              Rs{" "}
                              {Number(
                                payment.totalPayment ?? payment.amount ?? 0,
                              ).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-right text-slate-700">
                              Rs{" "}
                              {Number(payment.whtAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-right text-slate-700">
                              Rs{" "}
                              {Number(payment.sstAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-slate-900">
                              Rs{" "}
                              {Number(
                                payment.receivedAmount ?? payment.amount ?? 0,
                              ).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
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
  );
}
