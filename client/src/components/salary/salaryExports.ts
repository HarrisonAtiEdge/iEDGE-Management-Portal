import { jsPDF } from "jspdf";
import type { SalaryEmployee, SalaryRun } from "@/lib/salaryModel";

export function salaryMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}
export function salaryCsvCell(value: string | number) {
  let text = String(value);
  if (typeof value === "string" && /^[\s]*[=+@\-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
function downloadCsv(name: string, rows: (string | number)[][]) {
  const blob = new Blob(["\ufeff", rows.map((r) => r.map(salaryCsvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportSalaryRegister(run: SalaryRun, employees: SalaryEmployee[]) {
  downloadCsv(`salary-register-${run.month}-${run.currency}.csv`, [
    ["Payroll month", "Status", "Employee ID", "Employee name", "CNIC / National ID", "Tax registration / NTN", "Company", "Department", "Designation", "Currency", "Gross", "Taxable", "Income tax", "Other deductions", "Net pay", "Paid days", "Days worked in tax year", "Days in tax year", "Annual standard salary", "Annual gross salary", "Less medical allowance", "Taxable annual salary", "Prior other taxable income", "Prior tax paid", "Projected annual taxable income", "Payment date", "Payment reference"],
    ...employees.map((e) => [run.month, run.status, e.profile.employment.employeeCode, e.profile.personal.fullName, e.profile.personal.nationalId, e.profile.personal.taxNumber, e.profile.employment.company, e.profile.employment.department, e.profile.employment.designation,
      run.currency, e.calculation.gross, e.calculation.taxable, e.calculation.incomeTax, e.calculation.otherDeductions, e.calculation.net, e.calculation.paidDays, e.calculation.daysWorkedInYear ?? "", e.calculation.taxYearDays ?? "", e.calculation.annualStandardSalary ?? "", e.calculation.annualGrossSalary ?? "", e.calculation.medicalAllowance ?? "", e.calculation.annualTaxableSalary ?? "", e.input.ytdTaxable, e.input.ytdTaxPaid, e.calculation.projectedAnnualTaxable, run.paymentDate || "", run.paymentReference || ""]),
  ]);
}
export function salaryBankIssues(employees: SalaryEmployee[]) {
  return employees.filter((e) => e.profile.payroll.paymentMethod === "bank_transfer" && (!e.profile.payroll.bankName || !e.profile.payroll.accountTitle || (!e.profile.payroll.accountNumber && !e.profile.payroll.iban)));
}
export function exportSalaryBank(run: SalaryRun, employees: SalaryEmployee[]) {
  if (!["approved", "paid"].includes(run.status)) throw new Error("Approve payroll before exporting the bank payment register.");
  if (salaryBankIssues(employees).length) throw new Error("Some employees are missing bank details. Return payroll to draft and update their profiles and salary records first.");
  downloadCsv(`bank-payment-register-${run.month}-${run.currency}.csv`, [
    ["Employee ID", "Employee name", "Bank", "Branch", "Account title", "Account number", "IBAN", "Currency", "Net amount", "Payroll month"],
    ...employees.filter((e) => e.profile.payroll.paymentMethod === "bank_transfer").map((e) => [e.profile.employment.employeeCode, e.profile.personal.fullName, e.profile.payroll.bankName, e.profile.payroll.branchName, e.profile.payroll.accountTitle, e.profile.payroll.accountNumber, e.profile.payroll.iban, run.currency, e.calculation.net, run.month]),
  ]);
}
export function downloadSalaryPayslip(run: SalaryRun, employee: SalaryEmployee) {
  const pdf = new jsPDF();
  let y = 20;
  const line = (text: string, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    const lines: string[] = pdf.splitTextToSize(text, 170);
    for (const part of lines) {
      if (y > 275) { pdf.addPage(); y = 20; }
      pdf.text(part, 20, y); y += 7;
    }
  };
  pdf.setFontSize(16); line(run.settings.companyName, true);
  pdf.setFontSize(10);
  if (run.settings.companyAddress) line(run.settings.companyAddress);
  line(`Payslip | ${run.month} | ${run.status.toUpperCase()}`, true);
  line(`${employee.profile.personal.fullName} | Employee ID: ${employee.profile.employment.employeeCode || "Pending"}`);
  line(`${employee.profile.employment.department} | ${employee.profile.employment.designation}`);
  line(`Payable days: ${employee.calculation.paidDays} / ${employee.calculation.denominator}`);
  const amount = (n: number) => `${run.currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  y += 4; line("EARNINGS", true);
  employee.calculation.components.forEach((c) => line(`${c.name} (${c.percentage}%): ${amount(c.amount)}`));
  employee.calculation.earnings.forEach((e) => line(`${e.name}: ${amount(e.amount)}`));
  line(`Gross salary: ${amount(employee.calculation.gross)}`, true);
  // Rows saved before the annual formula have no breakdown to show.
  if (employee.calculation.annualTaxableSalary != null) {
    line(`Days worked in tax year: ${employee.calculation.daysWorkedInYear} / ${employee.calculation.taxYearDays}`);
    line(`Annual standard salary: ${amount(employee.calculation.annualStandardSalary)}`);
    line(`Annual gross salary: ${amount(employee.calculation.annualGrossSalary)}`);
    line(`Less medical allowance: ${amount(employee.calculation.medicalAllowance)}`);
    line(`Taxable annual salary: ${amount(employee.calculation.annualTaxableSalary)}`);
  } else if (employee.profile.payroll.taxableSalary != null) line(`Monthly taxable salary from profile: ${amount(employee.profile.payroll.taxableSalary)}`);
  line(`Taxable income this month after adjustments: ${amount(employee.calculation.taxable)}`);
  y += 4; line("DEDUCTIONS", true);
  line(`Income tax: ${amount(employee.calculation.incomeTax)}`);
  employee.calculation.deductions.forEach((d) => line(`${d.name}: ${amount(d.amount)}`));
  line(`NET PAY: ${amount(employee.calculation.net)}`, true);
  y += 4; line(`Tax policy: ${run.policy.name} | Tax year: ${run.policy.taxYear}`);
  if (run.paymentDate) line(`Payment date: ${run.paymentDate} | Reference: ${run.paymentReference || ""}`);
  if (run.status !== "approved" && run.status !== "paid") line("DRAFT / UNAPPROVED - figures may change.", true);
  pdf.save(`payslip-${run.month}-${employee.profile.employment.employeeCode || employee.userId}.pdf`);
}
