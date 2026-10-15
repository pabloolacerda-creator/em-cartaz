import type { Entry } from '../core/types';
import EntryForm from './EntryForm';
import EntryManageList from './EntryManageList';

interface Props {
  tab: 'in' | 'out';
  reload: () => Promise<void>;
  entries: Entry[];
}

export default function RegisterScreen({ tab, reload, entries }: Props) {
  const onSaved = () => { void reload(); };
  const items = entries.filter((e) => e.kind === tab);

  return (
    <div className="space-y-4">
      <EntryForm key={tab} kind={tab} onSaved={onSaved} />
      <EntryManageList entries={items} reload={reload} emptyText="Nada cadastrado ainda." />
    </div>
  );
}
