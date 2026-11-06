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
    // No celular: empilhado (form em cima, lista embaixo).
    // No PC largo (lg): duas colunas lado a lado; o form fica fixo no topo
    // enquanto a lista rola.
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="lg:sticky lg:top-6">
        <EntryForm key={tab} kind={tab} onSaved={onSaved} />
      </div>
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
