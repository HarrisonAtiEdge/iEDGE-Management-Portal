import type { FareOption, FareTax } from "./types";

export interface FareTaxLine extends FareTax {
  amount: number;
}

export interface FareTotals {
  serviceChargeAmount: number;
  taxes: FareTaxLine[];
  taxAmount: number;
  /** What the client pays for the rate; null until the fare is entered. */
  ticketAmount: number | null;
}

const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

const percentOf = (base: number, percent: number) => roundMoney((base * percent) / 100);

/**
 * A rate's charges and final amount. Percentages are taken on the fare alone,
 * as on hotel bookings, so taxes don't apply to the service charges. Every
 * line is rounded before adding, so the lines shown always sum to the total.
 */
export function fareTotals(fare: Pick<FareOption, "amount" | "serviceCharge" | "taxes">): FareTotals {
  const base = fare.amount ?? 0;
  const { type, value } = fare.serviceCharge;
  const serviceChargeAmount = type === "percent" ? percentOf(base, value ?? 0) : value ?? 0;
  const taxes = fare.taxes.map((tax) => ({ ...tax, amount: percentOf(base, tax.percent) }));
  const taxAmount = roundMoney(taxes.reduce((sum, tax) => sum + tax.amount, 0));

  return {
    serviceChargeAmount,
    taxes,
    taxAmount,
    ticketAmount: fare.amount === null ? null : roundMoney(base + serviceChargeAmount + taxAmount),
  };
}
