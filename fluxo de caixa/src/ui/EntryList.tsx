import type { Entry } from '../core/types';
import { formatBRL } from '../core/money';

const ddmm = (d: string): string => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function Tag({ children, tone = 'text-muted' }: { children: string; tone?: string }) {
  return (
    <span className={`rounded-full border border-line px-2 py-0.5 text-xs ${tone}`}>
      {children}
    </span>
  );
}

function Row({ e }: { e: Entry }) {
  const isIn = e.kind === 'in';
  const partial = e.paidCents > 0 && e.paidCents < e.amountCents;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        aria-hidden
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
          isIn ? 'bg-green/15 text-green' : 'bg-red/15 text-red'
        }`}
      >
        {isIn ? '↓' : '↑'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{e.name}</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Tag>{isIn ? `a receber ${ddmm(e.dueDate)}` : `Vence ${ddmm(e.dueDate)}`}</Tag>
          {e.sourceFixedId && <Tag>repete todo mês</Tag>}
          {partial && (
            <Tag tone="text-amber">{`pago em parte · falta ${formatBRL(e.amountCents - e.paidCents)}`}</Tag>
          )}
        </div>
      </div>
      <div className={`shrink-0 font-semibold tabular-nums ${isIn ? 'text-green' : 'text-red'}`}>
        {isIn ? '+' : '−'} {formatBRL(e.amountCents)}
      </div>
    </li>
  );
}

export default function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
      {entries.length === 0 ? (
        <li className="px-4 py-6 text-center text-sm text-muted">
          Nenhum lançamento neste mês.
        </li>
      ) : (
        entries.map(e => <Row key={e.id} e={e} />)
      )}
    </ul>
  );
}
