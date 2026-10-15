import { useMemo, useState } from 'react';
import type { Entry } from '../core/types';
import { monthSummary } from '../core/summary';
import { useMonth } from './MonthContext';
import StatCards, { type StatKey } from './StatCards';
import EntryList from './EntryList';
import EntryDetail from './EntryDetail';

interface Props {
  entries: Entry[];
  reload: () => Promise<void>;
}

const STAT_TITLES: Record<StatKey, string> = {
  earned: 'Quanto ganhei',
  spent: 'Quanto gastei',
  toReceive: 'Tenho pra entrar',
  toPay: 'Tenho pra sair',
};

export default function Caixa({ entries, reload }: Props) {
  const { month } = useMonth();
  const [openList, setOpenList] = useState<StatKey | null>(null);

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
        statKey={openList}
        allEntries={entries}
        month={month}
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
