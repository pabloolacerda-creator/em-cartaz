import type { Entry } from '../core/types';
import EntryManageList from './EntryManageList';

export default function EntryDetail({
  title,
  entries,
  onBack,
  reload,
}: {
  title: string;
  entries: Entry[];
  onBack: () => void;
  reload: () => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted hover:text-white"
      >
        ← Voltar
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
      <EntryManageList
        entries={entries}
        reload={reload}
        emptyText="Nenhum lançamento aqui neste mês."
      />
    </div>
  );
}
