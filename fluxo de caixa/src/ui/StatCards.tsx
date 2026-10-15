import type { MonthSummary } from '../core/summary';
import { formatBRL } from '../core/money';

export type StatKey = 'earned' | 'spent' | 'toReceive' | 'toPay';

function Card({
  label, value, tone, sub, wide, onClick,
}: {
  label: string;
  value: number;
  tone: string;
  sub?: string;
  wide?: boolean;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);
  return (
    <div
      className={`glass rounded-2xl p-4 ${wide ? 'col-span-2' : ''} ${
        clickable ? 'cursor-pointer transition hover:brightness-125' : ''
      }`}
      {...(clickable
        ? {
            role: 'button',
            tabIndex: 0,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            },
          }
        : {})}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
        {clickable && <span aria-hidden className="text-xs text-muted">›</span>}
      </div>
      <div className={`mt-1 text-xl font-semibold tabular-nums sm:text-2xl ${tone}`}>
        {formatBRL(value)}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export default function StatCards({
  summary,
  onOpen,
}: {
  summary: MonthSummary;
  onOpen?: (key: StatKey) => void;
}) {
  const open = (key: StatKey) => (onOpen ? () => onOpen(key) : undefined);
  return (
    <section aria-label="Resumo do mês" className="space-y-3">
      <div className="glass relative overflow-hidden rounded-3xl p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-green/10 blur-3xl"
        />
        <div className="relative text-sm text-muted">Quanto tenho agora</div>
        <div
          className={`relative mt-1 text-4xl font-bold tabular-nums sm:text-5xl ${
            summary.have < 0 ? 'text-red' : 'text-txt'
          }`}
        >
          {formatBRL(summary.have)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card label="Quanto ganhei" value={summary.earned} tone="text-green" onClick={open('earned')} />
        <Card label="Quanto gastei" value={summary.spent} tone="text-red" onClick={open('spent')} />
        <Card label="Tenho pra entrar" value={summary.toReceive} tone="text-blue" onClick={open('toReceive')} />
        <Card label="Tenho pra sair" value={summary.toPay} tone="text-red" onClick={open('toPay')} />
        <Card
          wide
          label="Sobra prevista no fim do mês"
          value={summary.projected}
          tone="text-amber"
          sub="(tenho + a entrar − a sair)"
        />
      </div>
    </section>
  );
}
