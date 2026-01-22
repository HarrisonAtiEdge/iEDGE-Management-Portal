import { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button, Input, Label } from "@/components/ui";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    accountTitle: '',
    accountNo: '',
    bank: '',
    branch: '',
    city: '',
  });

  useEffect(() => {
    // Load account<Switch>
  {/* Other Routes */}
  <ProtectedRoute path="/accounts" exact>
    <Accounts />
  </ProtectedRoute>
  <ProtectedRoute path="/accounts/cheque">
    {/* Cheque component or details page */}
  </ProtectedRoute>
  <ProtectedRoute path="/accounts/online">
    {/* Online component or details page */}
  </ProtectedRoute>
  <ProtectedRoute path="/accounts/add">
    {/* This can be the Accounts component which handles Add New as well */}
    <Accounts />
  </ProtectedRoute>
  {/* Other Routes */}
</Switch>s from Firebase if needed
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    // Implement fetching from Firestore as needed
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "accounts"), formData);
      setFormData({
        accountTitle: '',
        accountNo: '',
        bank: '',
        branch: '',
        city: '',
      });
      // Add logic to refresh accounts list
    } catch (error) {
      console.error("Error adding account: ", error);
    }
  };

  return (
    <div>
      <h2 className="text-3xl">Accounts</h2>
      <form onSubmit={handleAddAccount}>
        <div>
          <Label htmlFor="accountTitle">Account Title</Label>
          <Input
            id="accountTitle"
            value={formData.accountTitle}
            onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="accountNo">Account No</Label>
          <Input
            id="accountNo"
            value={formData.accountNo}
            onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="bank">Bank</Label>
          <Input
            id="bank"
            value={formData.bank}
            onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="branch">Branch</Label>
          <Input
            id="branch"
            value={formData.branch}
            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
        <Button type="submit">Add Account</Button>
      </form>

      {/* Implement logic to display existing accounts */}
      {/* Display Account List */}
      <ul>
        {accounts.map(account => (
          <li key={account.id}>{account.accountTitle} - {account.accountNo}</li>
        ))}
      </ul>
    </div>
  );
}