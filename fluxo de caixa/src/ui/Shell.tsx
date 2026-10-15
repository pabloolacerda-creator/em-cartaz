import { useState } from 'react';
import { MonthProvider } from './MonthContext';
import { useData } from './useData';
import RegisterScreen from './RegisterScreen';
import Caixa from './Caixa';
import TopBar, { type Tab } from './TopBar';

function ShellInner() {
  const [tab, setTab] = useState<Tab>('caixa');
  const { entries, fixedBills, reload, loading, error } = useData();
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
        {tab === 'caixa' ? (
          <Caixa entries={entries} fixedBills={fixedBills} reload={reload} />
        ) : (
          <RegisterScreen tab={tab} reload={reload} entries={entries} fixedBills={fixedBills} />
        )}
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
