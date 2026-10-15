import { useState, type FormEvent } from 'react';
import { parseBRL } from '../core/money';
import type { Kind, NewEntry } from '../core/types';
import { createEntry } from '../data/entries';

interface Props {
  kind: Kind;
  onSaved: () => void;
  onSubmit?: (input: NewEntry) => unknown;
}

const inputCls =
  'w-full rounded-lg border border-line bg-bg px-3 py-2 text-txt placeholder:text-muted focus:outline-none focus:border-blue';

export default function EntryForm({ kind, onSaved, onSubmit = createEntry }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [valor, setValor] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = parseBRL(valor);
  const invalid = valor.trim() !== '' && cents === null;
  const canSubmit = cents !== null && name.trim() !== '' && dueDate !== '' && !busy;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (cents === null) return;
    setError(null);
    setBusy(true);
    try {
      await onSubmit({
        kind,
        name: name.trim(),
        description: description.trim(),
        amountCents: cents,
        paidCents: 0,
        purchaseDate,
        dueDate,
        paidDate: null,
        sourceFixedId: null,
      });
      setName(''); setDescription(''); setValor(''); setPurchaseDate(''); setDueDate('');
      onSaved();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  const btn = kind === 'in' ? 'bg-green text-bg' : 'bg-red text-bg';

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-card p-4">
      <div>
        <label htmlFor="ef-name" className="mb-1 block text-sm text-muted">Nome</label>
        <input id="ef-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="ef-desc" className="mb-1 block text-sm text-muted">Descrição</label>
        <input id="ef-desc" className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label htmlFor="ef-valor" className="mb-1 block text-sm text-muted">Valor</label>
        <input id="ef-valor" className={inputCls} inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
        {invalid && <p role="alert" className="mt-1 text-sm text-red">Valor inválido</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ef-purchase" className="mb-1 block text-sm text-muted">Data da compra</label>
          <input id="ef-purchase" type="date" className={inputCls} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ef-due" className="mb-1 block text-sm text-muted">Vencimento</label>
          <input id="ef-due" type="date" required className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <p className="mt-1 text-xs text-muted">Obrigatório</p>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red">{error}</p>}
      <button type="submit" disabled={!canSubmit} className={`rounded-lg px-4 py-2 font-semibold disabled:opacity-40 ${btn}`}>
        Salvar
      </button>
    </form>
  );
}
