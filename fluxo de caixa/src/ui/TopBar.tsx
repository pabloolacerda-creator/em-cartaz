import { signOut } from '../data/auth';
import { useMonth } from './MonthContext';

export type Tab = 'caixa' | 'in' | 'out';

const TABS: { id: Tab; label: string }[] = [
  { id: 'caixa', label: 'Caixa' },
  { id: 'in', label: 'Entradas' },
  { id: 'out', label: 'Saídas' },
];

function shift(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`;
}

export default function TopBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { month, setMonth } = useMonth();
  const stepBtn =
    'h-9 w-9 rounded-full border border-line bg-card text-txt hover:border-muted';
  return (
    <header className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Meu Caixa</h1>
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm text-muted hover:text-txt"
        >
          Sair
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="glass flex flex-wrap gap-1 rounded-full p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`rounded-full px-4 py-1.5 text-sm ${
                tab === t.id ? 'bg-blue text-bg font-medium' : 'text-muted hover:text-txt'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Mês anterior" className={stepBtn}
            onClick={() => setMonth(shift(month, -1))}>‹</button>
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="h-9 rounded-full border border-line bg-card px-3 text-sm text-txt"
          />
          <button type="button" aria-label="Próximo mês" className={stepBtn}
            onClick={() => setMonth(shift(month, 1))}>›</button>
        </div>
      </div>
    </header>
  );
}
