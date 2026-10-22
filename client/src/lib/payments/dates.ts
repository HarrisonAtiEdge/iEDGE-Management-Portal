// Dates chosen on payment and transfer forms are kept as YYYY-MM-DD strings,
// the value an <input type="date"> uses.

const pad = (value: number) => String(value).padStart(2, "0");

/** A day as YYYY-MM-DD in local time (today by default). */
export function localDateValue(date: Date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The moment to record for a payment made on the chosen day. Today keeps the
 * current time; any other day is stored at local noon, so converting it to UTC
 * (as some reports do) can't move it onto a neighbouring day.
 */
export function paymentMomentFor(dateValue?: string) {
  const now = new Date();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateValue || "").trim());

  if (!match || dateValue === localDateValue(now)) return now;

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
}
