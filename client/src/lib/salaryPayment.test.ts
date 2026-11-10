import assert from "node:assert/strict";
import test from "node:test";
import { initialEmployeeProfile } from "./employeeProfileModel";
import { buildAccountLedger, calculateAccountBalances, type AccountLedgerData } from "./payments/accountBalances";
import type { SalaryEmployee } from "./salaryModel";
import {
  amountInWords, buildTransferLetterHTML, changePayment, defaultTransferLetter, emptySalaryPayment, letterAmount, payrollTransferTotal,
  rtgsDraftFor, rtgsDraftIssues, salaryAccountEntries, salaryPaymentIssues, salaryPaymentSchema, salaryTransferLetterSchema, sameTransferCheque, syncTransferTotals,
  transferLetterTotal, transferRowsFor, type SalaryFromAccount, type SalaryPayment,
} from "./salaryPayment";

const account: SalaryFromAccount = { key: "payment:hmb", accountTitle: "M/s. iEDGE", accountNumber: "03-12-20311-714-108360", bank: "Habib Metropolitan Bank Limited", branch: "Khyaban-e-Nishat Branch", city: "Karachi" };
const other: SalaryFromAccount = { ...account, key: "payment:other", accountTitle: "Other" };

function row(userId: string, net: number, payment?: Partial<SalaryPayment>, bank: Record<string, string> = {}) {
  const profile = initialEmployeeProfile({ id: userId, displayName: `Employee ${userId}`, email: `${userId}@example.com`, employeeCode: userId });
  profile.personal.phone = "0300-1234567"; profile.personal.currentAddress = "Karachi";
  Object.assign(profile.payroll, { accountTitle: `Title ${userId}`, accountNumber: `6-01-${userId}`, iban: "", bankName: "HMB", branchName: "Main", ...bank });
  return { id: userId, userId, profile, calculation: { net }, payment: payment ? { ...emptySalaryPayment(), ...payment } : undefined } as unknown as SalaryEmployee;
}

test("every method needs a from account and cheque number, and all but transfer also need a date", () => {
  assert.deepEqual(salaryPaymentIssues(undefined), ["Payment method"]);
  assert.deepEqual(salaryPaymentIssues(emptySalaryPayment()), ["Payment method"]);
  assert.deepEqual(salaryPaymentIssues({ ...emptySalaryPayment(), method: "transfer" }), ["From account", "Cheque number"]);
  assert.deepEqual(salaryPaymentIssues({ ...emptySalaryPayment(), method: "transfer", fromAccount: account }), ["Cheque number"]);
  assert.deepEqual(salaryPaymentIssues({ ...emptySalaryPayment(), method: "transfer", fromAccount: account, chequeNumber: "183671996" }), []);
  for (const method of ["rtgs", "cash", "cheque"] as const) {
    assert.deepEqual(salaryPaymentIssues({ ...emptySalaryPayment(), method, fromAccount: account }), ["Cheque number", "Cheque date"]);
    assert.deepEqual(salaryPaymentIssues({ ...emptySalaryPayment(), method, fromAccount: account, chequeNumber: "183671996" }), ["Cheque date"]);
    assert.deepEqual(salaryPaymentIssues({ ...emptySalaryPayment(), method, fromAccount: account, chequeNumber: "183671996", chequeDate: "2026-11-05" }), []);
  }
});
test("salary can only come from a Finance → Accounts account, which is the only kind with a balance", () => {
  assert.deepEqual(salaryPaymentIssues({ ...emptySalaryPayment(), method: "transfer", chequeNumber: "1", fromAccount: { ...account, key: "cheque:old" } }), ["From account"]);
});
test("a paid run is one entry per RTGS, cheque or cash employee and one per account for transfers", () => {
  const rows = [
    row("a", 1000, { method: "rtgs", fromAccount: account, chequeDate: "2026-11-04" }),
    row("b", 2000.5, { method: "cheque", fromAccount: account, chequeNumber: "111", chequeDate: "2026-11-03" }),
    row("c", 3000, { method: "transfer", fromAccount: account }),
    row("d", 4000.25, { method: "transfer", fromAccount: account }),
    row("e", 5000, { method: "transfer", fromAccount: other }),
    row("f", 6000),
    row("g", 0, { method: "cash", fromAccount: account, chequeNumber: "1", chequeDate: "2026-11-01" }),
  ];
  const entries = salaryAccountEntries("2026-10_PKR", "2026-10", rows, "2026-11-05", "REF-1");
  assert.deepEqual(entries.map((entry) => [entry.id, entry.accountId, entry.amount, entry.date]), [
    ["2026-10_PKR_a", "hmb", 1000, "2026-11-04"],
    ["2026-10_PKR_b", "hmb", 2000.5, "2026-11-03"],
    ["2026-10_PKR_transfer_hmb", "hmb", 7000.25, "2026-11-05"],
    ["2026-10_PKR_transfer_other", "other", 5000, "2026-11-05"],
  ]);
  assert.equal(entries[1].chequeNumber, "111");
  assert.equal(entries[1].description, "Salary 2026-10 - Employee b (Cheque)");
  assert.equal(entries[2].description, "Salary 2026-10 - Transfer to 2 employees");
  assert.deepEqual(entries[2].employeeIds, ["c", "d"]);
});
test("salary payments reduce the calculated account balance and appear in the ledger", () => {
  const data: AccountLedgerData = {
    accounts: [{ id: "hmb", openingBalance: 100000, openingBalanceDate: "2026-07-01" }, { id: "other", openingBalance: 50000 }],
    payments: [], invoiceRequests: [], purchaseOrders: [], claimReimbursements: [], records: [], transfers: [], manualEntries: [], salesRecords: [], meetingUpdates: [],
    salaryPayments: [
      { id: "one", accountId: "hmb", amount: 30000.5, date: "2026-11-05", description: "Salary" },
      { id: "two", accountId: "hmb", amount: 9000, date: "2026-11-05", status: "cancelled" },
      { id: "three", accountId: "hmb", amount: 5000, date: "2026-06-30" },
    ],
  };
  const ledger = buildAccountLedger(data);
  assert.deepEqual(ledger.map((entry) => [entry.key, entry.kind, entry.debit]), [["salary-one", "salary", 30000.5], ["salary-three", "salary", 5000]]);
  const balances = calculateAccountBalances(data.accounts, ledger);
  assert.equal(balances.hmb.released, 30000.5);
  assert.equal(balances.hmb.current, 69999.5);
  assert.equal(balances.other.current, 50000);
});
const transferTo = (fromAccount: SalaryFromAccount, chequeNumber = ""): SalaryPayment => ({ ...emptySalaryPayment(), method: "transfer", fromAccount, chequeNumber });
const chequeNumbers = (list: Array<{ payment: SalaryPayment }>) => list.map((item) => item.payment.chequeNumber);
test("typing a transfer cheque number fills everyone paid by transfer from that account only", () => {
  const list = [{ userId: "a", payment: transferTo(account, "555") }, { userId: "b", payment: transferTo(account) }, { userId: "c", payment: transferTo(other, "777") }, { userId: "d", payment: { ...emptySalaryPayment(), method: "rtgs" as const, fromAccount: account, chequeNumber: "999" } }];
  assert.deepEqual(chequeNumbers(sameTransferCheque(list, "a")), ["555", "555", "777", "999"]);
  assert.deepEqual(chequeNumbers(sameTransferCheque(list, "b")), ["", "", "777", "999"]);
});
test("someone joining a transfer picks up its cheque number, and leaves their old one behind", () => {
  const rtgs: SalaryPayment = { ...emptySalaryPayment(), method: "rtgs", fromAccount: account, chequeNumber: "111" };
  const moved = changePayment(rtgs, { method: "transfer" });
  assert.equal(moved.chequeNumber, "");
  assert.deepEqual(chequeNumbers(sameTransferCheque([{ userId: "a", payment: transferTo(account, "555") }, { userId: "b", payment: moved }])), ["555", "555"]);
  assert.equal(changePayment(transferTo(account, "555"), { fromAccount: other }).chequeNumber, "");
  assert.equal(changePayment(transferTo(account, "555"), { chequeNumber: "556" }).chequeNumber, "556");
  assert.equal(changePayment(rtgs, { chequeNumber: "112" }).chequeNumber, "112");
});
test("the cheque number reaches the transfer letter and the account statement entry", () => {
  const rows = [row("a", 1000, transferTo(account, "183671996")), row("b", 2000, transferTo(account, "183671996"))];
  assert.equal(defaultTransferLetter(rows, account, "date").chequeNumber, "183671996");
  const [entry] = salaryAccountEntries("run", "2026-10", rows, "2026-11-05", "REF");
  assert.equal(entry.chequeNumber, "183671996"); assert.equal(entry.amount, 3000);
  assert.equal(salaryAccountEntries("run", "2026-10", [row("c", 1000, { method: "rtgs", fromAccount: account, chequeNumber: "42" })], "2026-11-05", "REF")[0].chequeNumber, "42");
});
test("payment details reject unknown methods and invalid dates", () => {
  assert.equal(salaryPaymentSchema.safeParse({ ...emptySalaryPayment(), method: "bitcoin" }).success, false);
  assert.equal(salaryPaymentSchema.safeParse({ ...emptySalaryPayment(), chequeDate: "05-11-2026" }).success, false);
  assert.equal(salaryPaymentSchema.safeParse(emptySalaryPayment()).success, true);
});
test("amounts in words and figures match the bank letter", () => {
  assert.equal(amountInWords(1529200), "Rupees One Million Five Hundred Twenty-Nine Thousand Two Hundred Only");
  assert.equal(amountInWords(99553.72), "Rupees Ninety-Nine Thousand Five Hundred Fifty-Three and Seventy-Two Paisa Only");
  assert.equal(letterAmount(1529200), "1,529,200");
  assert.equal(letterAmount(99553.72), "99,553.72");
  assert.equal(letterAmount(99553.7), "99,553.70");
});
test("an RTGS letter takes the employee's bank details, preferring the IBAN", () => {
  const draft = rtgsDraftFor(row("a", 99553.72, { method: "rtgs", chequeNumber: "111", chequeDate: "2026-11-05" }, { iban: "PK36HABB0000" }));
  assert.deepEqual(draft.to, { accountTitle: "Title a", address: "Karachi", mobileNumber: "0300-1234567", accountNo: "PK36HABB0000", bank: "HMB", branch: "Main" });
  assert.equal(draft.amount, 99553.72); assert.equal(draft.chequeNumber, "111"); assert.equal(draft.date, "November 05, 2026");
  assert.deepEqual(rtgsDraftIssues(draft), []);
  assert.equal(rtgsDraftFor(row("b", 1000)).to.accountNo, "6-01-b");
});
test("an RTGS letter reports exactly what is missing", () => {
  const draft = rtgsDraftFor(row("a", 0, undefined, { accountTitle: "", accountNumber: "", bankName: "" }));
  assert.equal(draft.to.accountTitle, "Employee a");
  assert.deepEqual(rtgsDraftIssues(draft), ["IBAN / account number", "Bank", "Amount", "Cheque number", "Date"]);
});
test("a transfer letter lists only that account's transfer employees", () => {
  const rows = [row("a", 1000, { method: "transfer", fromAccount: account }), row("b", 2000, { method: "transfer", fromAccount: other }), row("c", 3000, { method: "rtgs", fromAccount: account }), row("d", 4000)];
  assert.deepEqual(transferRowsFor(rows, account.key).map((r) => r.userId), ["a"]);
  assert.equal(payrollTransferTotal(transferRowsFor(rows, other.key)), 2000);
});
test("a transfer letter is built from the account and bank details, with matching totals", () => {
  const letter = defaultTransferLetter([row("a", 99500), row("b", 89500.5)], account, "November 05, 2026", { name: "Signer", designation: "CEO", company: "iEDGE" });
  assert.equal(salaryTransferLetterSchema.safeParse(letter).success, true);
  assert.equal(letter.bank, account.bank); assert.equal(letter.accountNumber, account.accountNumber); assert.equal(letter.subject, "FUNDS TRANSFER – M/S. IEDGE");
  assert.deepEqual(letter.rows[0], { id: "a", accountTitle: "Title a", accountNumber: "6-01-a", amount: 99500 });
  assert.equal(transferLetterTotal(letter), 189000.5);
  assert.equal(letter.amount, "PKR. 189,000.50/-"); assert.equal(letter.totalText, "Rs: 189,000.50/-");
  assert.equal(letter.signatoryName, "Signer");
});
test("the sample July 2025 letter's amounts reproduce its total and words", () => {
  const amounts = [99500, 99500, 89500, 45000, 80000, 10000, 99500, 99500, 64750, 69600, 64750, 64750, 64850, 99500, 99500, 59900, 30000, 89600, 74750, 74750, 50000];
  const letter = syncTransferTotals({ ...defaultTransferLetter([], account, "August 06, 2025"), rows: amounts.map((amount, index) => ({ id: String(index), accountTitle: "x", accountNumber: "y", amount })) });
  assert.equal(letter.amount, "PKR. 1,529,200/-");
  assert.equal(letter.totalText, "Rs: 1,529,200/-");
  assert.equal(letter.inWords, "Rupees One Million Five Hundred Twenty-Nine Thousand Two Hundred Only");
});
test("adding a row splits one employee across two accounts and updates the totals", () => {
  const base = defaultTransferLetter([row("a", 90000)], account, "date");
  const split = syncTransferTotals({ ...base, rows: [{ ...base.rows[0], amount: 80000 }, { id: "extra", accountTitle: "Title a", accountNumber: "6-01-second", amount: 10000 }] });
  assert.equal(transferLetterTotal(split), 90000);
  assert.equal(split.rows.length, 2);
});
test("the printed letter numbers its rows and shows edited text safely", () => {
  const letter = { ...defaultTransferLetter([row("a", 1000), row("b", 2000)], account, "Today"), subject: `<script>alert("x")</script>`, intro: "Edited intro" };
  const html = buildTransferLetterHTML(letter);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Edited intro"));
  assert.match(html, /<td class="stl-center">2<\/td>/);
  assert.ok(html.includes("Rs: 3,000/-"));
});
