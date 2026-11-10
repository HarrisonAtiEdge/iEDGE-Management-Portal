// Creates the per-employee RTGS letters. They are saved through the RTGS module,
// so they share its serial numbers and appear in the RTGS List like any other
// letter. No account balance is changed.
import {
  accountPrefix, ensureRtgsAccountId, nextSerial, saveLetter, SerialTakenError,
  type RtgsFromAccount, type RtgsSignatory,
} from "@/components/RTGS/rtgsData";
import { buildLetterHTML } from "@/components/RTGS/rtgsLetter";
import { markSalaryRtgsLetter } from "./salaryService";
import { letterAmount, type SalaryRtgsDraft } from "./salaryPayment";

const SERIAL_ATTEMPTS = 3;

interface CreateOptions {
  runId: string;
  signatories: RtgsSignatory[];
  actor: { firstName: string; lastName: string };
  onCreated: (userId: string, serialNo: string) => void;
}

// "IE-2026-0042" -> "IE-2026-0043"
const followingSerial = (serial: string) => serial.replace(/\d+$/, (digits) => String(Number(digits) + 1).padStart(digits.length, "0"));

async function saveWithNextSerial(account: RtgsFromAccount, rtgsId: string, draft: SalaryRtgsDraft, options: CreateOptions, lastSerials: Map<string, string>) {
  const prefix = accountPrefix({ id: rtgsId, accountTitle: account.accountTitle });
  const from = {
    accountTitle: account.accountTitle, accountNumber: account.accountNumber, bank: account.bank, branch: account.branch, city: account.city,
    chequeNumber: draft.chequeNumber, amount: letterAmount(draft.amount), inWords: draft.inWords,
  };
  for (let attempt = 1; ; attempt++) {
    // Only look the number up once per batch; saving still refuses a taken number.
    const last = lastSerials.get(prefix);
    const serialNo = last ? followingSerial(last) : await nextSerial(prefix, rtgsId);
    const { firstName, lastName } = options.actor;
    const letterHTML = buildLetterHTML({ date: draft.date, serialNo, from, to: draft.to, signatories: options.signatories, createdBy: `${firstName} - ${lastName}` });
    try {
      await saveLetter(rtgsId, serialNo, prefix, {
        serialNo, date: draft.date, from, to: draft.to, signatories: options.signatories, letterHTML,
        createdAt: new Date(), prefix, createdby: { firstName: { firstName }, lastName: { lastName } },
        salaryRunId: options.runId, salaryEmployeeId: draft.userId,
      });
      lastSerials.set(prefix, serialNo);
      return serialNo;
    } catch (error) {
      // Someone else took this number in the RTGS module; take the next one.
      if (!(error instanceof SerialTakenError) || attempt >= SERIAL_ATTEMPTS) throw error;
      lastSerials.delete(prefix);
    }
  }
}

/**
 * Letters save one at a time, because each needs the serial after the previous
 * one. Recording each on its payroll row runs alongside the next letter. On
 * failure, letters already created stay recorded against their employees, so
 * trying again only creates the ones that are left.
 */
export async function createSalaryRtgsLetters(items: Array<{ draft: SalaryRtgsDraft; account: RtgsFromAccount }>, options: CreateOptions) {
  // The first letter from a new account links it to an RTGS ID. Reuse that link
  // so the rest of the batch doesn't create a second ID for the same account.
  const rtgsIds = new Map<string, string>(), lastSerials = new Map<string, string>();
  const recording: Array<Promise<void>> = [], unrecorded: string[] = [];
  try {
    for (const { draft, account } of items) {
      const rtgsId = rtgsIds.get(account.key) ?? await ensureRtgsAccountId(account);
      rtgsIds.set(account.key, rtgsId);
      const serialNo = await saveWithNextSerial(account, rtgsId, draft, options, lastSerials);
      recording.push(markSalaryRtgsLetter(options.runId, draft.userId, serialNo).then(
        () => options.onCreated(draft.userId, serialNo),
        () => { unrecorded.push(`${serialNo} (${draft.employeeName})`); },
      ));
    }
  } finally {
    await Promise.all(recording);
  }
  if (unrecorded.length) throw new Error(`Letters ${unrecorded.join(", ")} were saved, but the payroll could not be updated. Don't create them again; check the RTGS List.`);
}
