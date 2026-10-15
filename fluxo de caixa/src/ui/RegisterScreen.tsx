import type { Entry } from '../core/types';
import EntryForm from './EntryForm';
import PeriodList from './PeriodList';
import { useMonth } from './MonthContext';

interface Props {
  tab: 'in' | 'out';
  reload: () => Promise<void>;
  entries: Entry[];
}

export default function RegisterScreen({ tab, reload, entries }: Props) {
  const { month } = useMonth();
  const onSaved = () => { void reload(); };
  const items = entries.filter((e) => e.kind === tab);

  return (
    <div className="space-y-4">
      <EntryForm key={tab} kind={tab} onSaved={onSaved} />
      <PeriodList
        entries={items}
        month={month}
        dateOf={(e) => e.dueDate}
        valueOf={(e) => e.amountCents}
        reload={reload}
        emptyText="Nada cadastrado ainda."
      />
    </div>
  );
}
