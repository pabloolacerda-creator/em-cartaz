import { useState } from 'react';
import { MonthProvider } from './MonthContext';
import { useData } from './useData';
import TopBar, { type Tab } from './TopBar';

const TITLES: Record<Tab, string> = {
  caixa: 'Caixa',
  in: 'Entradas',
  out: 'Saídas',
  fixed: 'Contas fixas',
};

function Placeholder({ title }: { title: string }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">Em breve.</p>
    </section>
  );
}

function ShellInner() {
  const [tab, setTab] = useState<Tab>('caixa');
  // Passed to screens in Tasks 8-10.
  const { loading, error } = useData();
  return (
    <div className="min-h-screen bg-bg text-txt">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <TopBar tab={tab} onTab={setTab} />
        {error && (
          <p role="alert" className="rounded-xl border border-red/40 bg-card p-3 text-sm text-red">
            Erro ao carregar dados: {error}
          </p>
        )}
        {loading && <p className="text-sm text-muted">Carregando...</p>}
        <Placeholder title={TITLES[tab]} />
      </div>
    </div>
  );
}

export default function Shell() {
  return (
    <MonthProvider>
      <ShellInner />
    </MonthProvider>
  );
}
