import { formatBRL } from '../core/money';
import type { Entry, FixedBill } from '../core/types';
import EntryForm from './EntryForm';
import FixedBillForm from './FixedBillForm';

interface Props {
  tab: 'in' | 'out' | 'fixed';
  reload: () => Promise<void>;
  entries: Entry[];
  fixedBills: FixedBill[];
}

export default function RegisterScreen({ tab, reload, entries, fixedBills }: Props) {
  const onSaved = () => { void reload(); };
  const items: { id: string; name: string; amountCents: number }[] =
    tab === 'fixed' ? fixedBills : entries.filter((e) => e.kind === tab);

  return (
    <div className="space-y-4">
      {tab === 'fixed' ? (
        <FixedBillForm onSaved={onSaved} />
      ) : (
        <EntryForm key={tab} kind={tab} onSaved={onSaved} />
      )}
      <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
        {items.length === 0 && <li className="p-3 text-sm text-muted">Nada cadastrado ainda.</li>}
        {items.map((it) => (
          <li key={it.id} className="flex justify-between p-3 text-sm">
            <span>{it.name}</span>
            <span className="text-muted">{formatBRL(it.amountCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
