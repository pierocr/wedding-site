// Flow requires each settlement search to cover fewer than 30 days.
export function flowDateRanges(startDate: string, endDate: string) {
  const day = 24 * 60 * 60 * 1000;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return [];
  const ranges: { startDate: string; endDate: string }[] = [];
  for (let cursor = start; cursor <= end; cursor += 29 * day) {
    ranges.push({
      startDate: new Date(cursor).toISOString().slice(0, 10),
      endDate: new Date(Math.min(cursor + 28 * day, end)).toISOString().slice(0, 10),
    });
  }
  return ranges;
}
