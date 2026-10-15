import { useState } from 'react';
import type { Entry } from '../core/types';
import { formatBRL, parseBRL } from '../core/money';
import { markPaid } from '../data/entries';

interface Props {
  entry: Entry;
  onDone: () => void;
  onPay?: (paidCents: number, paidDate: string) => void | Promise<void>;
}

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function PayModal({ entry, onDone, onPay }: Props) {
  const isIn = entry.kind === 'in';
  const verb = isIn ? 'receber' : 'pagar';
  const remaining = entry.amountCents - entry.paidCents;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = text.trim() === '' ? null : parseBRL(text);
  const invalid = text.trim() !== '' && (parsed === null || parsed <= 0);

  async function apply(paidCents: number) {
    setBusy(true);
    setError(null);
    const paidDate = today();
    try {
      if (onPay) await onPay(paidCents, paidDate);
      else await markPaid(entry.id, paidCents, paidDate);
      onDone();
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
      setBusy(false);
    }
  }

  const payPartial = () => {
    if (parsed === null || parsed <= 0) return;
    void apply(Math.min(entry.amountCents, entry.paidCents + parsed));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onDone}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-card p-5"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-semibold">{entry.name}</h2>
          <p className="text-sm text-muted">
            {`Falta ${isIn ? 'receber' : 'pagar'} ${formatBRL(remaining)}`}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void apply(entry.amountCents)}
          className="w-full rounded-xl bg-green/20 px-4 py-2 font-semibold text-green disabled:opacity-50"
        >
          {isIn ? 'Receber tudo' : 'Pagar tudo'}
        </button>
        <div className="space-y-2">
          <label htmlFor="pay-partial" className="block text-sm text-muted">
            Valor parcial
          </label>
          <input
            id="pay-partial"
            value={text}
            onChange={e => setText(e.target.value)}
            inputMode="decimal"
            placeholder="R$ 0,00"
            className="w-full rounded-xl border border-line bg-transparent px-3 py-2"
          />
          {invalid && <p className="text-sm text-red">Valor inválido</p>}
          <button
            type="button"
            disabled={busy || parsed === null || parsed <= 0}
            onClick={payPartial}
            className="w-full rounded-xl border border-line px-4 py-2 disabled:opacity-50"
          >
            Confirmar parcial
          </button>
        </div>
        {error && <p className="text-sm text-red">{error}</p>}
        <button
          type="button"
          onClick={onDone}
          className="w-full text-sm text-muted"
          aria-label={`Cancelar ${verb}`}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
