import type { AirlineOption, AirportOption } from "../types";

const WORD_SPLIT = /[\s,/()'.-]+/;

/** Lower rank = better match; -1 = no match. */
function rankText(text: string, query: string, baseRank: number): number {
  const value = text.toLowerCase();
  if (value.startsWith(query)) return baseRank;
  if (value.split(WORD_SPLIT).some((word) => word.startsWith(query))) return baseRank + 1;
  if (value.includes(query)) return baseRank + 2;
  return -1;
}

function rankLookup(
  item: { code: string; name: string; aliases: string[]; cityCode?: string },
  query: string,
): number {
  const upper = query.toUpperCase();
  const lower = query.toLowerCase();

  if (item.code === upper) return 0;
  if (item.cityCode && item.cityCode === upper) return 1;
  if (item.code.startsWith(upper)) return 2;

  const nameRank = rankText(item.name, lower, 3);
  if (nameRank >= 0) return nameRank;

  for (const alias of item.aliases) {
    const aliasRank = rankText(alias, lower, 6);
    if (aliasRank >= 0) return aliasRank;
  }

  return -1;
}

function rankedFilter<T extends { code: string; name: string; aliases: string[]; cityCode?: string }>(
  items: T[],
  query: string,
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return items;

  return items
    .map((item) => ({ item, rank: rankLookup(item, trimmed) }))
    .filter((entry) => entry.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.item.name.localeCompare(b.item.name))
    .map((entry) => entry.item);
}

export const filterAirports = (items: AirportOption[], query: string) =>
  rankedFilter(items, query);

export const filterAirlines = (items: AirlineOption[], query: string) =>
  rankedFilter(items, query);
