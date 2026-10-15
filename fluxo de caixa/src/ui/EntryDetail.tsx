import type { Entry } from '../core/types';
import type { StatKey } from './StatCards';
import PeriodList from './PeriodList';

const isRealized = (k: StatKey): boolean => k === 'spent' || k === 'earned';
const statValue = (k: StatKey, e: Entry): number =>
  isRealized(k) ? e.paidCents : e.amountCents - e.paidCents;

export default function EntryDetail({
  title,
  statKey,
  allEntries,
  month,
  onBack,
  reload,
}: {
  title: string;
  statKey: StatKey;
  allEntries: Entry[];
  month: string;
  onBack: () => void;
  reload: () => Promise<void>;
}) {
  const wantOut = statKey === 'toPay' || statKey === 'spent';
  const candidates = allEntries.filter(
    (e) => (e.kind === 'out') === wantOut && statValue(statKey, e) > 0,
  );

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-muted hover:text-white">
        ← Voltar
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
      <PeriodList
        entries={candidates}
        month={month}
        dateOf={(e) => (isRealized(statKey) ? e.paidDate : e.dueDate)}
        valueOf={(e) => statValue(statKey, e)}
        reload={reload}
        emptyText="Nenhum lançamento neste período."
      />
    </div>
  );
}
