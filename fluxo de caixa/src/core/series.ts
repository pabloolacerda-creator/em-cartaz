export type Freq = 'monthly' | 'weekly';

const pad = (n: number): string => String(n).padStart(2, '0');

function addMonths(start: string, n: number): string {
  const [y, m, d] = start.split('-').map(Number);
  const idx = y * 12 + (m - 1) + n;
  const ny = Math.floor(idx / 12);
  const nm = idx % 12; // 0-based month
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${pad(nm + 1)}-${pad(Math.min(d, last))}`;
}

function addDays(start: string, n: number): string {
  const [y, m, d] = start.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/**
 * Returns `count` ISO 'YYYY-MM-DD' due dates starting at `start`, stepping by
 * one month (day clamped to the month's last day) or one week (7 days).
 * `count` is the total number of occurrences, including the first.
 */
export function seriesDueDates(start: string, freq: Freq, count: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(freq === 'monthly' ? addMonths(start, i) : addDays(start, i * 7));
  }
  return dates;
}
