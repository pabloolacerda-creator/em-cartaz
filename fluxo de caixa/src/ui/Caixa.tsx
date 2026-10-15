import { useEffect, useMemo, useRef } from 'react';
import type { Entry, FixedBill } from '../core/types';
import { monthSummary } from '../core/summary';
import { occurrencesToGenerate } from '../core/recurring';
import { createEntry } from '../data/entries';
import { useMonth } from './MonthContext';
import StatCards from './StatCards';
import EntryList from './EntryList';

interface Props {
  entries: Entry[];
  fixedBills: FixedBill[];
  reload: () => Promise<void>;
}

export default function Caixa({ entries, fixedBills, reload }: Props) {
  const { month } = useMonth();
  // Keys (fixedId|dueDate) of occurrences already created or in flight. Survives
  // StrictMode double-effects and month changes; only cleared on failure.
  const handled = useRef<Set<string>>(new Set());

  useEffect(() => {
    const todo = occurrencesToGenerate(fixedBills, entries, month).filter(
      o => !handled.current.has(`${o.sourceFixedId}|${o.dueDate}`),
    );
    if (todo.length === 0) return;
    todo.forEach(o => handled.current.add(`${o.sourceFixedId}|${o.dueDate}`));
    void (async () => {
      try {
        await Promise.all(todo.map(createEntry));
      } catch {
        // keys stay marked: no retry loop; a page reload retries
      }
      await reload();
    })();
  }, [month, fixedBills, entries, reload]);

  const monthEntries = useMemo(
    () =>
      entries
        .filter(
          e => e.dueDate.slice(0, 7) === month || e.paidDate?.slice(0, 7) === month,
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [entries, month],
  );
  const summary = useMemo(() => monthSummary(entries, month), [entries, month]);

  return (
    <div className="space-y-6">
      <StatCards summary={summary} />
      <EntryList entries={monthEntries} reload={reload} />
    </div>
  );
}
