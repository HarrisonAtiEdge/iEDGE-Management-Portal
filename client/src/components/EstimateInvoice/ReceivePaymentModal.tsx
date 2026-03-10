import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
    addDoc,
    collection,
    query,
    where,
    getDocs,
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

type Props = {
    invoice: any;
    onClose: () => void;
};

export default function ReceivePaymentModal({ invoice, onClose }: Props) {
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [method, setMethod] = useState("");
    const [reference, setReference] = useState("");
    const [depositTo, setDepositTo] = useState("");
    const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [searchInvoice, setSearchInvoice] = useState("");

    useEffect(() => {
        fetchOutstanding();
        fetchPayments();
    }, [invoice.client]);

    const fetchOutstanding = async () => {
        const q = query(
            collection(db, "Panels", "IEDGE-SYSTEM", "estimateInvoices"),
            where("client", "==", invoice.client),
            where("status", "!=", "Paid"),
        );

        const snapshot = await getDocs(q);

        const data: any[] = [];

        snapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        setOutstandingInvoices(data);
    };

    const fetchPayments = async () => {
        const q = query(
            collection(db, "Panels", "IEDGE-SYSTEM", "payments"),
            where("client", "==", invoice.client),
        );

        const snapshot = await getDocs(q);

        const data: any[] = [];

        snapshot.forEach((doc) => {
            data.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        setPayments(data);
    };

    const handleSave = async () => {
        try {
            await addDoc(collection(db, "Panels", "IEDGE-SYSTEM", "payments"), {
                invoiceId: invoice.id,
                client: invoice.client,
                amount: Number(amount),
                paymentDate,
                method,
                reference,
                depositTo,
                createdAt: serverTimestamp(),
            });

            const currentBalance = invoice.balance ?? invoice.total;
            const newBalance = currentBalance - Number(amount);

            await updateDoc(
                doc(
                    db,
                    "Panels",
                    "IEDGE-SYSTEM",
                    "estimateInvoices",
                    invoice.id,
                ),
                {
                    balance: newBalance,
                    status: newBalance <= 0 ? "Paid" : "Partially Paid",
                },
            );

            onClose();
        } catch (error) {
            console.error("Payment Error:", error);
        }
    };

    const total = invoice.total;
    const balance = invoice.balance ?? invoice.total;
    const paid = total - balance;

    const paidPercent = ((paid / total) * 100).toFixed(1);
    const remainingPercent = (100 - Number(paidPercent)).toFixed(1);

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white w-[1000px] p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Receive Payment</h2>

                <div className="grid grid-cols-2 gap-6">
                    {/* LEFT SIDE FORM */}

                    <div className="space-y-4">
                        <div>
                            <Label>Customer</Label>
                            <input
                                className="border p-2 w-full rounded"
                                value={invoice.client}
                                readOnly
                            />
                        </div>

                        <div>
                            <Label>Email</Label>
                            <input
                                className="border p-2 w-full rounded"
                                value={invoice.email}
                                readOnly
                            />
                        </div>

                        <div>
                            <Label>Payment Date</Label>
                            <input
                                type="date"
                                className="border p-2 w-full rounded"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Payment Method</Label>
                            <select
                                className="border p-2 w-full rounded"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                            >
                                <option value="">Select Method</option>
                                <option>Cash</option>
                                <option>Check</option>
                                <option>Credit Card</option>
                                <option>Direct Debit</option>
                            </select>
                        </div>

                        <div>
                            <Label>Reference No</Label>
                            <input
                                className="border p-2 w-full rounded"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Deposit To (Account)</Label>

                            <Select
                                value={depositTo}
                                onValueChange={(value) => setDepositTo(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="iedge">iEDGE</SelectItem>

                                    <SelectItem value="iedge-travel">
                                        IEDGE TRAVEL & TOURS (PRIVATE) LIMITED
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* RIGHT SIDE PAYMENT INFO */}

                    <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
                        <div>
                            <div className="text-xs text-gray-500">
                                Amount Due
                            </div>

                            <div className="text-xl font-bold">
                                Rs {invoice.total}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500">
                                Customer Balance
                            </div>

                            <div className="text-lg font-semibold">
                                Rs {invoice.balance || invoice.total}
                            </div>

                            <div className="text-xs text-gray-500">
                                Paid: {paidPercent}% | Remaining:{" "}
                                {remainingPercent}%
                            </div>

                            <div className="w-full bg-gray-200 rounded h-2 mt-1">
                                <div
                                    className="bg-green-500 h-2 rounded"
                                    style={{ width: `${paidPercent}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Amount Received</Label>

                            <input
                                type="number"
                                className="border p-2 w-full rounded"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* TRANSACTIONS SECTION */}

                <div className="grid grid-cols-2 gap-6 mt-8">
                    {/* Outstanding */}

                    <div>
                        <h3 className="mb-2 font-semibold">
                            Outstanding Transactions
                        </h3>
                        <input
                            placeholder="Search Invoice..."
                            className="border p-2 w-full mb-2 rounded"
                            value={searchInvoice}
                            onChange={(e) => setSearchInvoice(e.target.value)}
                        />

                        <div className="h-[150px] overflow-y-auto border rounded">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-left">
                                            Invoice
                                        </th>
                                        <th className="p-2 text-left">Date</th>
                                        <th className="p-2 text-right">
                                            Amount
                                        </th>
                                        <th className="p-2 text-right">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {outstandingInvoices
                                        .filter((inv) =>
                                            inv.invoiceNo
                                                ?.toLowerCase()
                                                .includes(
                                                    searchInvoice.toLowerCase(),
                                                ),
                                        )
                                        .sort((a, b) =>
                                            a.id === invoice.id
                                                ? -1
                                                : b.id === invoice.id
                                                  ? 1
                                                  : 0,
                                        )
                                        .map((inv) => (
                                            <tr
                                                key={inv.id}
                                                className={`border-b ${
                                                    inv.id === invoice.id
                                                        ? "bg-yellow-100 font-semibold"
                                                        : ""
                                                }`}
                                            >
                                                <td className="p-2">
                                                    {inv.invoiceNo}
                                                </td>
                                                <td className="p-2">
                                                    {inv.invoiceDate}
                                                </td>
                                                <td className="p-2 text-right">
                                                    Rs {inv.total}
                                                </td>
                                                <td className="p-2 text-right">
                                                    Rs {inv.balance}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment History */}

                    <div>
                        <h3 className="mb-2 font-semibold">Payment History</h3>

                        <table className="w-full border text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2 text-left">Method</th>
                                    <th className="p-2 text-left">Reference</th>
                                    <th className="p-2 text-right">Amount</th>
                                </tr>
                            </thead>

                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p.id} className="border-b">
                                        <td className="p-2">{p.paymentDate}</td>
                                        <td className="p-2">{p.method}</td>
                                        <td className="p-2">{p.reference}</td>
                                        <td className="p-2 text-right">
                                            Rs {p.amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* BUTTONS */}

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>

                    <Button
                        className="bg-green-600 text-white"
                        onClick={handleSave}
                    >
                        Save Payment
                    </Button>
                </div>
            </div>
        </div>
    );
}
