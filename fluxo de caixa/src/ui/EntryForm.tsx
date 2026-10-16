import { useState, type FormEvent } from 'react';
import { parseBRL } from '../core/money';
import type { Kind, NewEntry } from '../core/types';
import { seriesDueDates, type Freq } from '../core/series';
import { CATEGORIES } from '../core/categories';
import { createEntry } from '../data/entries';

interface Props {
  kind: Kind;
  onSaved: () => void;
  onSubmit?: (input: NewEntry) => unknown;
}

type Repeat = 'none' | Freq;

const inputCls =
  'w-full rounded-lg border border-line bg-bg px-3 py-2 text-txt placeholder:text-muted focus:outline-none focus:border-blue';

const MAX_TIMES = 60;

export default function EntryForm({ kind, onSaved, onSubmit = createEntry }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [valor, setValor] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [repeat, setRepeat] = useState<Repeat>('none');
  const [times, setTimes] = useState('');
  const [settled, setSettled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = parseBRL(valor);
  const invalid = valor.trim() !== '' && cents === null;
  const count = parseInt(times, 10);
  const timesOk =
    repeat === 'none' || (Number.isInteger(count) && count >= 2 && count <= MAX_TIMES);
  const canSubmit =
    cents !== null && name.trim() !== '' && dueDate !== '' && timesOk && !busy;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (cents === null || !timesOk) return;
    setError(null);
    setBusy(true);
    const base = {
      kind,
      name: name.trim(),
      description: description.trim(),
      category,
      amountCents: cents,
    };
    // Income has no "purchase date": its purchase date mirrors the receipt date.
    const purchaseFor = (d: string) => (kind === 'in' ? d : purchaseDate);
    try {
      if (repeat === 'none') {
        await onSubmit({
          ...base,
          purchaseDate: purchaseFor(dueDate),
          dueDate,
          paidCents: settled ? cents : 0,
          paidDate: settled ? dueDate : null,
          sourceFixedId: null,
        });
      } else {
        const seriesId = crypto.randomUUID();
        for (const d of seriesDueDates(dueDate, repeat, count)) {
          await onSubmit({ ...base, purchaseDate: purchaseFor(d), dueDate: d, paidCents: 0, paidDate: null, sourceFixedId: seriesId });
        }
      }
      setName(''); setDescription(''); setCategory(''); setValor('');
      setPurchaseDate(''); setDueDate(''); setRepeat('none'); setTimes(''); setSettled(false);
      onSaved();
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  const btn = kind === 'in' ? 'bg-green text-bg' : 'bg-red text-bg';

  return (
    <form onSubmit={submit} className="glass space-y-3 rounded-2xl p-4">
      <div>
        <label htmlFor="ef-name" className="mb-1 block text-sm text-muted">Nome</label>
        <input id="ef-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ef-desc" className="mb-1 block text-sm text-muted">Descrição</label>
          <input id="ef-desc" className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ef-cat" className="mb-1 block text-sm text-muted">Categoria</label>
          <select id="ef-cat" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Sem categoria</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="ef-valor" className="mb-1 block text-sm text-muted">Valor</label>
        <input id="ef-valor" className={inputCls} inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
        {invalid && <p role="alert" className="mt-1 text-sm text-red">Valor inválido</p>}
      </div>
      {kind === 'in' ? (
        <div>
          <label htmlFor="ef-due" className="mb-1 block text-sm text-muted">
            {repeat === 'none' ? 'Data do recebimento' : 'Primeiro recebimento'}
          </label>
          <input id="ef-due" type="date" required className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <p className="mt-1 text-xs text-muted">Obrigatório</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ef-purchase" className="mb-1 block text-sm text-muted">Data da compra</label>
            <input id="ef-purchase" type="date" className={inputCls} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ef-due" className="mb-1 block text-sm text-muted">
              {repeat === 'none' ? 'Vencimento' : 'Primeiro vencimento'}
            </label>
            <input id="ef-due" type="date" required className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <p className="mt-1 text-xs text-muted">Obrigatório</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ef-repeat" className="mb-1 block text-sm text-muted">Repetição</label>
          <select
            id="ef-repeat"
            className={inputCls}
            value={repeat}
            onChange={(e) => setRepeat(e.target.value as Repeat)}
          >
            <option value="none">Não repete</option>
            <option value="monthly">Mensal</option>
            <option value="weekly">Semanal</option>
          </select>
        </div>
        {repeat !== 'none' && (
          <div>
            <label htmlFor="ef-times" className="mb-1 block text-sm text-muted">Quantas vezes</label>
            <input
              id="ef-times"
              className={inputCls}
              inputMode="numeric"
              placeholder="ex: 12"
              value={times}
              onChange={(e) => setTimes(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">Total de lançamentos (2 a {MAX_TIMES})</p>
          </div>
        )}
      </div>
      {repeat === 'none' && (
        <label className="flex items-center gap-2 text-sm text-txt">
          <input
            type="checkbox"
            checked={settled}
            onChange={(e) => setSettled(e.target.checked)}
            className="h-4 w-4 accent-green"
          />
          {kind === 'in' ? 'Já recebi' : 'Já paguei'}
        </label>
      )}
      {error && <p role="alert" className="text-sm text-red">{error}</p>}
      <button type="submit" disabled={!canSubmit} className={`rounded-lg px-4 py-2 font-semibold disabled:opacity-40 ${btn}`}>
        Salvar
      </button>
    </form>
  );
}
