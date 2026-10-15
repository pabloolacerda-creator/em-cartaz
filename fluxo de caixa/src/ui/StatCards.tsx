import type { MonthSummary } from '../core/summary';
import { formatBRL } from '../core/money';

function Card({
  label, value, tone, sub, wide,
}: { label: string; value: number; tone: string; sub?: string; wide?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-card p-4 ${wide ? 'col-span-2' : ''}`}
    >
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums sm:text-2xl ${tone}`}>
        {formatBRL(value)}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export default function StatCards({ summary }: { summary: MonthSummary }) {
  return (
    <section aria-label="Resumo do mês" className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-[0_0_60px_-15px_rgba(61,220,132,0.35)]">
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
        <Card label="Quanto ganhei" value={summary.earned} tone="text-green" />
        <Card label="Quanto gastei" value={summary.spent} tone="text-red" />
        <Card label="Tenho pra entrar" value={summary.toReceive} tone="text-blue" />
        <Card label="Tenho pra sair" value={summary.toPay} tone="text-red" />
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
