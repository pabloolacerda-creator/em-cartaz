import { useState, type FormEvent } from 'react';
import { parseBRL } from '../core/money';
import type { FixedBill } from '../core/types';
import { createFixedBill } from '../data/fixedBills';

interface Props {
  kind?: 'out';
  onSaved: () => void;
  onSubmit?: (input: Omit<FixedBill, 'id'>) => unknown;
}

const inputCls =
  'w-full rounded-lg border border-line bg-bg px-3 py-2 text-txt placeholder:text-muted focus:outline-none focus:border-blue';

export default function FixedBillForm({ kind = 'out', onSaved, onSubmit = createFixedBill }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [valor, setValor] = useState('');
  const [day, setDay] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = parseBRL(valor);
  const valorInvalid = valor.trim() !== '' && cents === null;
  const dayNum = /^\d+$/.test(day.trim()) ? Number(day.trim()) : null;
  const dayOk = dayNum !== null && dayNum >= 1 && dayNum <= 31;
  const dayInvalid = day.trim() !== '' && !dayOk;
  const canSubmit = cents !== null && dayOk && name.trim() !== '' && !busy;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (cents === null || dayNum === null || !dayOk) return;
    setError(null);
    setBusy(true);
    try {
      await onSubmit({ kind, name: name.trim(), description: description.trim(), amountCents: cents, dueDay: dayNum });
      setName(''); setDescription(''); setValor(''); setDay('');
      onSaved();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-card p-4">
      <div>
        <label htmlFor="fb-name" className="mb-1 block text-sm text-muted">Nome</label>
        <input id="fb-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="fb-desc" className="mb-1 block text-sm text-muted">Descrição</label>
        <input id="fb-desc" className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label htmlFor="fb-valor" className="mb-1 block text-sm text-muted">Valor</label>
        <input id="fb-valor" className={inputCls} inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
        {valorInvalid && <p role="alert" className="mt-1 text-sm text-red">Valor inválido</p>}
      </div>
      <div>
        <label htmlFor="fb-day" className="mb-1 block text-sm text-muted">Dia do vencimento</label>
        <input id="fb-day" className={inputCls} inputMode="numeric" placeholder="1 a 31" value={day} onChange={(e) => setDay(e.target.value)} />
        {dayInvalid && <p role="alert" className="mt-1 text-sm text-red">Dia deve ser de 1 a 31</p>}
      </div>
      {error && <p role="alert" className="text-sm text-red">{error}</p>}
      <button type="submit" disabled={!canSubmit} className="rounded-lg bg-red px-4 py-2 font-semibold text-bg disabled:opacity-40">
        Salvar
      </button>
    </form>
  );
}
