# Estimates, Invoices & Payments — how it works

A map of the Estimate → Invoice → Payment features in this app, written so a
new session can pick up feature work without re-reading every file. Paths are
relative to this repo (`iEDGE-Management-Portal`). Last updated 2026-11-13.

> **Heads-up:** most of these files start with a large commented-out old
> version. The "live code" line numbers below are where the code that actually
> runs begins — read from there.

## 1. The flow

```
Sales Record ──"Create Estimate"──▶ Estimate ──"Load Estimate"──▶ Invoice ──Receive Payment──▶ Payment
(salesRecords)   (localStorage        (estimates)   (by Estimate No)  (estimateInvoices)  (Wallet icon)    (payments)
                  context)            IE-200001…                       S-000123, IHS-…
```

All data is in Firestore under `Panels/IEDGE-SYSTEM/…` (`PANEL_ID = "IEDGE-SYSTEM"`).

## 2. Files

| File | Live code from | What it is |
|---|---|---|
| `client/src/pages/Estimate.tsx` | ~144 | `/estimate` page: tabs "Create New" / "List"; reads `?tab=list&estimateNo=` from global search |
| `client/src/components/Estimate/EstimateForm.tsx` | line 1 (component at ~535, `handleSave` ~1732) | Create / edit / duplicate an estimate |
| `client/src/components/Estimate/EstimateList.tsx` | ~1132 | Estimate list, filters, Excel export, PDF preview, inline status |
| `client/src/pages/EstimateInvoice.tsx` | ~70 | `/invoice-estimate` page: tabs "Create Estimate Invoice" / "Estimate Invoice List" |
| `client/src/components/EstimateInvoice/EstimateInvoiceForm.tsx` | ~1535 (`loadEstimateAndPrefill` ~2055, `handleSaveInvoice` ~2169) | Create / edit / duplicate an invoice from an estimate |
| `client/src/components/EstimateInvoice/EstimateInvoiceList.tsx` | ~1157 (`getPaymentSplit` ~1391, `handleExport` ~1980, `handleRepairBalances` ~2072) | Invoice list, filters, CSV export, PDF preview, Receive Payment entry point |
| `client/src/components/EstimateInvoice/ReceivePaymentModal.tsx` | ~1846 (component ~1988, `handleSave` ~2442) | Record a payment against an invoice; also used by `components/RTDManagement/RTDInvoice.tsx` |
| `client/src/lib/estimatePdf.ts` | ~1032 (`buildEstimatePdfBlob` ~1325) | Estimate PDF (jsPDF + autotable), multi-currency lines |
| `client/src/lib/estimateInvoicePdf.ts` | ~756 (`buildEstimateInvoicePdfBlob` ~987) | Invoice PDF: heading, TO/meta block, services table, totals (or % block), taxation summary, message, terms pages, footer |
| `client/src/lib/payments/accountBalances.ts` | ~267 | Shared account ledger used by the Account Statement and Accounts tab (invoice payments credit an account, WHT+SST debit it) |
| `client/src/components/Estimate/EstimateEditChoiceDialog.tsx` | line 1 | Popup shown on Edit: edit in place or save as a copy (§3a) |
| `client/src/components/Estimate/EstimateHistoryDialog.tsx` | line 1 | History button in the list: who changed what, when, before/after |
| `client/src/lib/estimateHistory.ts` | line 1 | Field diff, history entries, copy counter |
| `client/src/types.ts` | `Estimate` at ~36 | Estimate type (loose — many extra fields are added with `as any`) |
| `client/src/pages/PaymentWaiverSettings.tsx` | — | Sets `settings/paymentSettings.paymentWaiverLimit` (Sundry tolerance) |
| `client/src/pages/SundryAdjustments.tsx` | — | Lists payments with waivers/Sundry |

Ignored on purpose: `Estimate/EstimateInternational.tsx`, `Estimate/EstimateInternationalList.tsx`.

## 3. Estimates

**Form fields:** Project Code (datalist of `salesRecords` with a project code;
picking one links `salesRecordId` and fills the client), Client, Issue Date,
Expiry Date, Project Owner, Payment Terms, Company, Tax Type
(`none` / `inclusive` / `exclusive`), Subject, PO Number, Status, Approval
received on, Terms & Conditions (picked from `termsConditions`, text editable),
Message. Options: **Add Currencies** (two currencies + "PKR per 1 unit" rates,
stored as `currency1Code`/`usdRate` and `currency2Code`/`euroRate` for
backward compatibility) and **Per Pax Cost** (`numberOfPax`).

**Service rows** (`ServiceItem`): drag to reorder (dnd-kit). `rate` is always
stored in **PKR**; the Rate inputs accept expressions (`500*3`), a percentage
(`10%` → `rateMode: "percent"`), or a value in either extra currency. Each row
has its own tax (`taxId/taxLabel/taxPercent`, from `tax`) and WHT
(`whtId/whtLabel/whtPercent`, from `withholdingTax`), and a
`showFinancialsInPdf` switch.

**Maths** (`calcLine`, `calcWhtAmount`):
- base = units × rate (or units × rate/100 in percent mode)
- exclusive: tax = base × pct/100, line = base + tax
- inclusive: tax = base × pct/(100+pct), line = base
- WHT = line × whtPct/100, applied **after** tax; total = Σ(line + WHT)

**Saving:** new estimates get their number in a transaction from
`counters/estimates` (`IE-` + next number, starting after 200000). Edits keep
the original `createdBy`/`createdByName`; when a tracked field changed they
also set `lastEditedBy*` and `editCount: increment(1)` (a save that changes
nothing isn't counted). A duplicate PO number only warns
(`poNumberNormalized` is stored). After saving, the PDF preview opens.

**Coming from a Sales Record:** `components/SalesRecordModal.tsx` writes
`localStorage["iedge-estimate-context"]` (+ `iedge-estimate-project-code`,
`-project-name`, `-client`, `-sales-record-id`); the form reads and then clears it.

**Statuses:** RFQ Sent, Approved, Rejected, Project Cancelled, Invoiced,
Payment Received, PO Received. Creating an invoice sets the estimate to
**Invoiced**.

**List:** filters (estimate no, project code, client, subject, PO / has-PO,
created by, date range, amount range), Excel export (`xlsx`), View PDF, Edit,
Duplicate, Delete (admins only), inline status select (admins and operation
admins).

## 3a. Editing: copies and history

Clicking Edit (list row or PDF drawer) opens `EstimateEditChoiceDialog` first.
Everyone ticks one of two options; Continue stays disabled until they do:
- **The estimate's creator** (`createdBy` = current user): "Keep the previous
  estimate as the first copy" or "Edit the same estimate".
- **Anyone else**: "This edit is for an invoice" or "Edit the same estimate".

The first option saves the edit as a copy that starts with all of the
estimate's fields; the original is untouched. "Edit the same estimate" edits
the original and is recorded in its History.

Copies are new `estimates` docs numbered from the original: `IE-200123-1`,
`-2`, … (counter at `counters/estimateCopies/estimates/{originalId}`; a copy
of a copy is still numbered from the original). They carry `copyOfEstimateId`,
`copyOfEstimateNo`, `copyNumber`, `copyPurpose` (`revision` / `invoice`),
`copiedFromEstimateId/No`, and `createdBy` = whoever made the copy.
Invoices load a copy by its own number as usual. The list badges copies
("Copy of IE-200123") and originals ("Original · 2 copies"). An estimate and
its copies don't trigger the duplicate-PO warning for each other.

**History:** `estimates/{id}/editHistory` gets one entry per in-place edit that
changed something (`type: "edit"`, `editNumber`), per inline status change
(`"status"`), per copy made (`"copy"`, on the original) and per invoice
created from it (`"invoice"`: the invoice number, plus the status change to
Invoiced; written in the invoice transaction). Each entry has
`editedAt`, `editedById/Name/Email`, `isCreator` and `changes`
(`{ field, label, before, after }`, display strings; service rows matched by
`rowId`, or by position for rows saved without one; dragging rows into a new
order adds a "Service order" change). Edits made before this
existed only show as a count ("N earlier edits…").

## 4. Invoices

**Creating:** type an Estimate No → **Load Estimate** copies the estimate into
the form (and shows the estimate total for reference). Only **one invoice per
estimate** (`sourceEstimateId`) is allowed when creating. Invoice fields:
heading (`Sales Tax Invoice` / `Performa Invoice` / `Invoice`), invoice date,
optional due date, status, PO number, company + logo, client/info/address,
project owner, subject, payment terms, services (detail, units, rate, tax,
WHT), a **billing percentage** (100/75/50/25/0 or custom), message, terms.

**Numbering:** per-company counters at
`counters/estimateInvoices/companies/{key}`, number padded to 6 digits:

| Company | Prefix | Counter key |
|---|---|---|
| iEDGE, iEDGE - Digital & Creative, iEDGE - Events & Activations | `S` | `iedge_sales` (falls back to the max of legacy `iedge`, `iedge_digital`, `iedge_events`) |
| iEDGE - Health Sciences | `IHS` | `iedge_health` |
| iEDGE - International Education | `IIE` | `iedge_edu` |
| iEDGE - Trading | `ITR` | `iedge_trade` |
| iEDGE - Travel & Tours | `S-T` | `iedge_travel` |
| Catapult | `CAT` | `catapult` |
| iConsultant | `IC` | `iconsultant` |
| Let's Save Green | `LSG` | `lsg` |
| Emaan Biz | `EB` | `emaanbiz` |

**Saved fields:** everything from the estimate (`...estData`) plus the invoice
fields above, `subtotal`, `tax`, `whtTotal`, `total`, `selectedPercentage`,
`selectedPercentageSubtotal/Tax/Total`, `invoiceNo`, `invoiceDate`, `dueDate`,
`status`, `sourceEstimateId`, `sourceEstimateNo`, `createdBy*`, timestamps.

**Statuses:** Unpaid, Partially Paid, Paid, Cancelled, Void (Void disables
Receive Payment).

**List:** filters (invoice no, estimate no, PO / has-PO, subject, client incl.
"no client", exact date, today/this month/last month, status, amount range,
created by, company group), summary cards, Export CSV, and per row: Receive
Payment, View PDF, Edit, Duplicate. The Project column comes from the
invoice's estimate → sales record. Partially Paid invoices show the received
amount (green) and remaining amount (red) under the total; whole amounts drop
".00". Non-admins only see invoices they created.

## 5. Receive Payment

`ReceivePaymentModal` loads the invoice, the client's other non-Paid invoices,
this invoice's payments, active payment accounts, and the Sundry limit
(`settings/paymentSettings.paymentWaiverLimit`).

- The amount typed is the **gross payment settled against the invoice**
  (label says "Actual Payment Received in Bank"). WHT and SST are entered as %
  or fixed and are deducted from it to show "Received Amount After Deduction".
- A shortfall or excess within the Sundry limit can be waived / recorded as
  Sundry, marking the invoice fully settled.
- **Payment document** (`payments`): `invoiceId`, `invoiceNo`, `client`,
  `amount` = `totalPayment` = `actualReceivedAmount`, `whtValue/whtMode/whtAmount`,
  `sstValue/sstMode/sstAmount`, `totalTaxDeduction`, `receivedAmount`,
  `waiverApplied`, `waivedAmount`, `waiverLimitUsed`, `balanceBeforeWaiver`,
  `excessBeforeWaiver`, `settledAmount` (this payment only), `paymentDate`,
  `method`, `reference`, `depositTo` (payment account id), `balanceAfter`,
  `methodDetails`, `createdAt`.
- **Invoice update:** `balance` (= Remaining Due across **all** payments and
  waivers), `status` (Paid / Partially Paid), `waiverApplied`,
  `lastWaivedAmount`, `totalWaivedAmount`, `waiverLimitUsed`,
  `lastPaymentAmount`, `lastPaymentSettledAmount`, `updatedAt`.
- Also: payment history table, outstanding invoices for the client, Excel and
  PDF export of the whole picture.

**Account Statement:** each payment is a ledger line on its `depositTo`
account: **Credit = `amount`**, **Debit = WHT + SST**, so the balance moves by
what reached the bank (`getPaymentMovement` in `accountBalances.ts`).

## 6. Who sees what

User flags on `Panels/IEDGE-SYSTEM/users/{uid}`: `isAdmin`, `isOperationAdmin`,
`isFinancialAdmin`.
- Estimates: admins / operation admins / financial admins load all; others only
  their own. Operation admins (alone) don't see estimates created by other
  admins. Delete = admins only; inline status = admins and operation admins.
- Invoices: any of the three flags → all invoices (`isAdmin` in the list is
  this combined check); otherwise only `createdBy == uid`.
- Estimate Project Code options use `localStorage["role"]`
  (`main_admin` / `finance` / `financial_admin` see all).

## 7. Known quirks (worth knowing before changing things)

1. New invoices have **no `balance`** until their first payment.
2. Editing an invoice saves a new `total` but **does not recalculate
   `balance`**; status can also be set by hand in the form.
3. Receive Payment always works against the **full `total`**, even when the
   invoice bills only a percentage of it.
4. The invoice form's "invoice is more/less than estimate" confirm lives in an
   effect on `services`, so it can fire repeatedly while editing.
5. New invoices copy every estimate field (`...estData`), which is why code
   falls back to `estimateNo` for `sourceEstimateNo`.
6. `fetchOutstanding` lists the client's invoices with `status != "Paid"`, which
   includes Void and Cancelled.

## 8. Environment notes

- Run locally with `npm run dev` → <http://localhost:5000>.
- `npx tsc --noEmit` has **24 pre-existing errors**, all in
  `client/src/pages/Accounts.tsx`; anything else is new.
- This repo and `D:\Projects\iEDGE-Management-System (1) (1)\iEDGE-Management-System`
  are two copies of the same app. Both use Firebase project
  **`addconferences-a374e`**, as does the live site — data written from
  localhost **is live data**. Changes are usually wanted in both copies (the
  files here are Prettier-formatted, so port by hand).
- `client/.env` sets `NODE_ENV=development`, so published builds are
  development builds and `import.meta.env.DEV` is true on the live site. Gate
  local-only tools by `window.location.hostname` instead (see `isLocalhost` in
  `EstimateInvoiceList.tsx`).
- Working files use CRLF line endings (`core.autocrlf=true`).

## 9. Recent changes (Nov 2026)

| Change | This repo | System copy |
|---|---|---|
| Account Statement: WHT + SST shown in Debit for invoice payments | already present (`861e3e3`) | `a066ad7` |
| Invoice list: received (green) / remaining (red) under the total for Partially Paid; no ".00" on whole amounts | already present | `75dc4eb` |
| Receive Payment: invoice balance counts every earlier payment (fixes fully paid invoices left as Partially Paid) | `c3b9527` | `dba98f9` |
| Invoice CSV export: Received and Remaining columns | `bed5739` | `93f72f9` |
| "Recalculate Balances" button (admins, localhost only) to repair invoices saved with the old balance bug — already run once; data is fixed | `bed5739` | `93f72f9` |
| Estimate edit popup, copies (`IE-…-1`) and History (§3a) | uncommitted | not ported |
