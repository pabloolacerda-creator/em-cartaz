import { useEffect, useMemo, useRef, useState } from 'react';
import type { Entry, FixedBill } from '../core/types';
import { monthSummary } from '../core/summary';
import { occurrencesToGenerate } from '../core/recurring';
import { createEntry } from '../data/entries';
import { useMonth } from './MonthContext';
import StatCards, { type StatKey } from './StatCards';
import EntryList from './EntryList';
import EntryDetail from './EntryDetail';

interface Props {
  entries: Entry[];
  fixedBills: FixedBill[];
  reload: () => Promise<void>;
}

const STAT_TITLES: Record<StatKey, string> = {
  earned: 'Quanto ganhei',
  spent: 'Quanto gastei',
  toReceive: 'Tenho pra entrar',
  toPay: 'Tenho pra sair',
};

function entriesForStat(key: StatKey, all: Entry[], month: string): Entry[] {
  return all.filter(e => {
    const remaining = e.amountCents - e.paidCents;
    switch (key) {
      case 'toPay':
        return e.kind === 'out' && remaining > 0 && e.dueDate.slice(0, 7) === month;
      case 'toReceive':
        return e.kind === 'in' && remaining > 0 && e.dueDate.slice(0, 7) === month;
      case 'spent':
        return e.kind === 'out' && e.paidCents > 0 && e.paidDate?.slice(0, 7) === month;
      case 'earned':
        return e.kind === 'in' && e.paidCents > 0 && e.paidDate?.slice(0, 7) === month;
    }
  });
}

export default function Caixa({ entries, fixedBills, reload }: Props) {
  const { month } = useMonth();
  const [openList, setOpenList] = useState<StatKey | null>(null);
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
      } catch (err) {
        // keys stay marked: no retry loop; a page reload retries.
        // A unique-violation (duplicate from another tab/device) is benign.
        console.error('Fixed-bill generation failed', err);
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

  if (openList) {
    return (
      <EntryDetail
        title={STAT_TITLES[openList]}
        entries={entriesForStat(openList, entries, month)}
        onBack={() => setOpenList(null)}
        reload={reload}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StatCards summary={summary} onOpen={setOpenList} />
      <EntryList entries={monthEntries} reload={reload} />
    </div>
  );
}
