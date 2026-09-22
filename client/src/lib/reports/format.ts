// Display-only formatting, kept separate from aggregateProjectReports.ts so
// changing how a number is *shown* never risks touching how it's *computed*.

export const formatMoney = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export const formatCompactMoney = (value: number) => {
  const amount = Number(value || 0);
  const abs = Math.abs(amount);

  if (abs >= 10000000) return `Rs. ${(amount / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `Rs. ${(amount / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}k`;

  return formatMoney(amount);
};

export const formatPercent = (value: number) =>
  `${Number(value || 0).toFixed(1)}%`;

export const formatDate = (value: string | null) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
