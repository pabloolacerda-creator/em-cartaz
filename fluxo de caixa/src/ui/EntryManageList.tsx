import { useState } from 'react';
import type { Entry } from '../core/types';
import { formatBRL } from '../core/money';
import { deleteEntry } from '../data/entries';
import ConfirmDialog from './ConfirmDialog';
import PayModal from './PayModal';

const ddmm = (d: string): string => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '');

function TrashIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  );
}

export default function EntryManageList({
  entries,
  reload,
  emptyText = 'Nenhum lançamento aqui.',
}: {
  entries: Entry[];
  reload: () => Promise<void>;
  emptyText?: string;
}) {
  const [confirming, setConfirming] = useState<Entry | null>(null);
  const [paying, setPaying] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(e: Entry) {
    setBusy(true);
    setError(null);
    try {
      await deleteEntry(e.id);
      await reload();
      setConfirming(null);
    } catch {
      setError('Não foi possível excluir. Tente de novo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red">{error}</p>}
      <ul className="glass divide-y divide-line overflow-hidden rounded-2xl">
        {entries.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-muted">{emptyText}</li>
        ) : (
          entries.map(e => {
            const isIn = e.kind === 'in';
            const partial = e.paidCents > 0 && e.paidCents < e.amountCents;
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.name}</div>
                  {e.description && (
                    <div className="truncate text-xs text-muted">{e.description}</div>
                  )}
                  <div className="mt-1 text-xs text-muted">
                    {isIn ? 'a receber' : 'vence'} {ddmm(e.dueDate)}
                    {e.sourceFixedId && ' · repetida'}
                    {partial && ` · falta ${formatBRL(e.amountCents - e.paidCents)}`}
                    {e.paidCents >= e.amountCents && e.amountCents > 0 && (isIn ? ' · recebido' : ' · pago')}
                  </div>
                </div>
                <div
                  className={`shrink-0 font-semibold tabular-nums ${
                    isIn ? 'text-green' : 'text-red'
                  }`}
                >
                  {formatBRL(e.amountCents)}
                </div>
                {e.paidCents < e.amountCents && (
                  <button
                    type="button"
                    onClick={() => setPaying(e)}
                    className="shrink-0 rounded-lg border border-line px-2 py-1 text-xs text-muted hover:text-white"
                  >
                    {isIn ? 'marcar recebido' : 'marcar pago'}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Excluir ${e.name}`}
                  onClick={() => setConfirming(e)}
                  className="shrink-0 rounded-lg border border-line p-2 text-muted hover:border-red hover:text-red"
                >
                  <TrashIcon />
                </button>
              </li>
            );
          })
        )}
      </ul>
      {confirming && (
        <ConfirmDialog
          title="Excluir lançamento?"
          message={`Tem certeza que quer excluir "${confirming.name}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          busy={busy}
          onCancel={() => setConfirming(null)}
          onConfirm={() => void remove(confirming)}
        />
      )}
      {paying && (
        <PayModal
          entry={paying}
          onDone={() => {
            setPaying(null);
            void reload();
          }}
        />
      )}
    </div>
  );
}
