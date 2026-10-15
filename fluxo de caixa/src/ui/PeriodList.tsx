import { useMemo, useState } from 'react';
import type { Entry } from '../core/types';
import { formatBRL } from '../core/money';
import EntryManageList from './EntryManageList';

export type Period = 'month' | 'year' | 'all';

export function inPeriod(date: string | null, month: string, period: Period): boolean {
  if (!date) return false;
  if (period === 'all') return true;
  if (period === 'year') return date.slice(0, 4) === month.slice(0, 4);
  return date.slice(0, 7) === month;
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'month', label: 'Mês' },
  { id: 'year', label: 'Ano' },
  { id: 'all', label: 'Tudo' },
];

export default function PeriodList({
  entries,
  month,
  dateOf,
  valueOf,
  reload,
  emptyText,
}: {
  entries: Entry[];
  month: string;
  dateOf: (e: Entry) => string | null;
  valueOf: (e: Entry) => number;
  reload: () => Promise<void>;
  emptyText?: string;
}) {
  const [period, setPeriod] = useState<Period>('month');
  const filtered = useMemo(
    () => entries.filter((e) => inPeriod(dateOf(e), month, period)),
    [entries, month, period, dateOf],
  );
  const total = useMemo(
    () => filtered.reduce((s, e) => s + valueOf(e), 0),
    [filtered, valueOf],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-2xl font-bold tabular-nums">{formatBRL(total)}</div>
        <div className="glass flex gap-1 rounded-full p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              aria-current={period === p.id ? 'true' : undefined}
              className={`rounded-full px-3 py-1 text-sm ${
                period === p.id ? 'bg-blue text-bg font-medium' : 'text-muted hover:text-txt'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <EntryManageList entries={filtered} reload={reload} emptyText={emptyText} />
    </div>
  );
}
