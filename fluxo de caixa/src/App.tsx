import AuthGate from './ui/AuthGate';
import Shell from './ui/Shell';

export default function App() {
  return (
    <AuthGate>
      <Shell />
    </AuthGate>
  );
}
