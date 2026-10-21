// The RAAST / OTC fund-transfer letter: HTML builder, print and PDF.
//
// The markup and class names match what the original RTGS app saves in
// `letterHTML`, so letters saved from either app print the same way in both.
// The letter is always rendered in its own document (print window, iframe),
// never in the app's page, so its CSS can't affect the rest of the app.
import type { RtgsRecord, RtgsSignatory } from "./rtgsData";

export const LETTER_CSS = `
  @media print {
    @page { size: A4; margin: 0.5cm; }
  }
  body {
    font-family: Arial, sans-serif;
    padding: 10px;
    font-size: 0.8rem;
    line-height: 1.3;
    width: 95%;
    height: 95%;
    margin: 0 auto;
  }
  .letter-content { display: flex; align-items: center; width: 100%; height: 90vh; }
  .letter-inner { width: 100%; padding-top: 1rem; padding-left: 3rem; }
  .letter-box { padding: 8px; margin: 8px 0; }
  .info { margin-left: 20px; padding-left: 20px; }
  .info-row { display: flex; margin-bottom: 4px; }
  .info-row strong { width: 150px; display: inline-block; text-align: left; }
  .info-row span { margin-left: 40px; }
  .letter-content p { margin: 2px 0; }
  .signature { margin-top: 15px; width: 45%; display: inline-block; vertical-align: top; margin-right: 10px; }
  .signatures-container { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 30px; width: 100%; }
  .sign { border-top: 1px solid #000; display: inline-block; padding-bottom: 3px; padding-top: 6px; font-weight: bold; min-width: 150px; }
  .datealign { display: flex; justify-content: space-between; margin-bottom: 10px; }
  h4 { margin: 4px 0 0px 0; text-decoration: underline; font-size: 14px; }
  strong { font-weight: bold; }
  .rtgs-line { width: 100%; text-align: center; }
  .rtgs-line p { font-weight: bold; text-decoration: underline; margin-top: 1rem; margin-bottom: 2rem; }
  .set { display: inline-block; }
  .marginright { margin-right: 40px; }
  .created-by { display: none; }
`;

// On screen the page is shorter than A4, so don't stretch the letter to 90vh.
const PREVIEW_CSS = `
  html, body { background: #fff; color: #000; }
  .letter-content { height: auto; min-height: 0; }
`;

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const infoRow = (label: string, value: unknown) =>
  `<div class="info-row"><strong>${label}</strong> <span>${escapeHtml(value)}</span></div>`;

export interface LetterData {
  date: string;
  serialNo: string;
  from?: RtgsRecord["from"];
  to?: RtgsRecord["to"];
  signatories?: RtgsSignatory[];
  createdBy?: string;
}

/** The letter body (what gets stored in `letterHTML`). */
export function buildLetterHTML(data: LetterData): string {
  const { from, to } = data;

  const signatures = (data.signatories || [])
    .map(
      (signatory) => `
        <div class="signature">
          <p class="sign">${escapeHtml(signatory.name)}</p>
          <p>${escapeHtml(signatory.designation)}</p>
          <p>${escapeHtml(signatory.company)}</p>
          <p>${escapeHtml(signatory.contact)}</p>
        </div>`,
    )
    .join("");

  const fromBox = from
    ? `<div class="letter-box">
        ${infoRow("Account Title:", from.accountTitle)}
        ${infoRow("Account Number:", from.accountNumber)}
        ${infoRow("Bank:", from.bank)}
        ${infoRow("Branch:", from.branch)}
        ${infoRow("City:", from.city)}
        ${infoRow("Cheque Number:", from.chequeNumber)}
        ${infoRow("Amount:", from.amount)}
        ${infoRow("In Words:", from.inWords)}
      </div>`
    : "";

  const toBox = to
    ? `<div class="letter-box">
        ${infoRow("Account Title:", to.accountTitle)}
        ${infoRow("Address:", to.address)}
        ${infoRow("Mobile Number:", to.mobileNumber)}
        ${infoRow("IBAN No:", to.accountNo)}
        ${infoRow("Bank:", to.bank)}
        ${infoRow("Branch:", to.branch)}
      </div>`
    : "";

  const createdBy = data.createdBy
    ? `<div class="created-by"><span>This letter created by &quot;${escapeHtml(data.createdBy)}&quot;</span></div>`
    : "";

  return `<div class="letter-content">
    <div class="letter-inner">
      <div class="datealign">
        <div><strong>Dated:</strong> ${escapeHtml(data.date)}</div>
        <div class="set marginright"><strong>Doc No: </strong> ${escapeHtml(data.serialNo)}</div>
      </div>
      <br />
      <p><strong>The Branch Manager</strong></p>
      <p><strong>${escapeHtml(from?.bank || "Bank Name")}, </strong></p>
      <p><strong>${escapeHtml(from?.city || "City Name")}.</strong></p>
      <div class="rtgs-line"><p>RAAST / OTC FUND TRANSFER</p></div>
      <p><strong>Dear Sir,</strong></p>
      <p>With reference to the subject matter, kindly RAAST / OTC Fund Transfer</p> <br />
      <h4> From:</h4>
      ${fromBox}
      <h4> To:</h4>
      ${toBox}
      <p>Looking forward to your support.</p>
      <p>Best Regards,</p>
      <div class="signatures-container">${signatures}</div>
    </div>
    ${createdBy}
  </div>`;
}

/** A saved record's letter: its stored HTML, or rebuilt from its fields. */
export function recordLetterHTML(record: RtgsRecord): string {
  if (record.letterHTML) return record.letterHTML;
  return buildLetterHTML({
    date: record.date || new Date().toLocaleDateString(),
    serialNo: record.serialNo || record.id,
    from: record.from,
    to: record.to,
    signatories: record.signatories,
  });
}

/** A complete standalone document for the letter. */
export function letterDocument(bodyHTML: string, options: { preview?: boolean } = {}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>RAAST Letter</title>
  <style>${LETTER_CSS}${options.preview ? PREVIEW_CSS : ""}</style>
</head>
<body>${bodyHTML}</body>
</html>`;
}

/** Opens the browser print dialog for the letter. Returns false if pop-ups are blocked. */
export function printLetter(bodyHTML: string): boolean {
  const printWindow = window.open("", "", "height=700,width=800");
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(letterDocument(bodyHTML));
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
  return true;
}

/** Renders the letter off-screen at A4 width and downloads it as a one-page PDF. */
export async function downloadLetterPdf(bodyHTML: string, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "absolute",
    left: "-9999px",
    top: "-9999px",
    width: "210mm",
    height: "297mm",
    border: "0",
  });
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) throw new Error("Could not create the PDF frame.");

    iframeDoc.open();
    iframeDoc.write(letterDocument(bodyHTML));
    iframeDoc.close();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    // A4 in cm with 0.5 cm margins, scaled down if the letter runs long.
    const pdf = new jsPDF({ unit: "cm", format: "a4", orientation: "portrait" });
    const margin = 0.5;
    const maxWidth = 21 - margin * 2;
    const maxHeight = 29.7 - margin * 2;
    let width = maxWidth;
    let height = (canvas.height * width) / canvas.width;
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    pdf.addImage(canvas.toDataURL("image/jpeg", 0.98), "JPEG", margin, margin, width, height);
    pdf.save(filename);
  } finally {
    document.body.removeChild(iframe);
  }
}
