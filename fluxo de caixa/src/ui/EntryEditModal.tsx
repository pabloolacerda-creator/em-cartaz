import { useState } from 'react';
import type { Entry } from '../core/types';
import { parseBRL, formatBRL } from '../core/money';
import { CATEGORIES, categoryColor } from '../core/categories';
import { updateEntry } from '../data/entries';

const inputCls =
  'w-full rounded-lg border border-line bg-bg px-3 py-2 text-txt placeholder:text-muted focus:outline-none focus:border-blue';

export default function EntryEditModal({
  entry,
  onDone,
}: {
  entry: Entry;
  onDone: () => void;
}) {
  const isIn = entry.kind === 'in';
  const [name, setName] = useState(entry.name);
  const [description, setDescription] = useState(entry.description);
  const [category, setCategory] = useState(entry.category);
  const [valor, setValor] = useState(formatBRL(entry.amountCents));
  const [purchaseDate, setPurchaseDate] = useState(entry.purchaseDate);
  const [dueDate, setDueDate] = useState(entry.dueDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = parseBRL(valor);
  const invalid = valor.trim() !== '' && cents === null;
  const canSave = cents !== null && name.trim() !== '' && dueDate !== '' && !busy;

  async function save() {
    if (cents === null) return;
    setBusy(true);
    setError(null);
    try {
      await updateEntry(entry.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        amountCents: cents,
        dueDate,
        purchaseDate: isIn ? dueDate : purchaseDate,
      });
      onDone();
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onDone}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="glass w-full max-w-sm space-y-3 rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Editar lançamento</h2>
        <div>
          <label htmlFor="ed-name" className="mb-1 block text-sm text-muted">Nome</label>
          <input id="ed-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ed-desc" className="mb-1 block text-sm text-muted">Descrição</label>
            <input id="ed-desc" className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ed-cat" className="mb-1 flex items-center gap-1.5 text-sm text-muted">
              Categoria
              {category && (
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: categoryColor(category) }} />
              )}
            </label>
            <select id="ed-cat" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Sem categoria</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="ed-valor" className="mb-1 block text-sm text-muted">Valor</label>
          <input id="ed-valor" className={inputCls} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
          {invalid && <p className="mt-1 text-sm text-red">Valor inválido</p>}
        </div>
        {isIn ? (
          <div>
            <label htmlFor="ed-due" className="mb-1 block text-sm text-muted">Data do recebimento</label>
            <input id="ed-due" type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ed-purchase" className="mb-1 block text-sm text-muted">Data da compra</label>
              <input id="ed-purchase" type="date" className={inputCls} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ed-due" className="mb-1 block text-sm text-muted">Vencimento</label>
              <input id="ed-due" type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onDone} className="flex-1 rounded-xl border border-line px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => void save()}
            className="flex-1 rounded-xl bg-blue px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
