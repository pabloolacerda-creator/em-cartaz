import AuthGate from './ui/AuthGate';

export default function App() {
  return (
    <AuthGate>
      <div className="min-h-screen bg-bg text-txt p-4">
        <h1 className="text-xl font-semibold">Fluxo de Caixa</h1>
      </div>
    </AuthGate>
  );
}
