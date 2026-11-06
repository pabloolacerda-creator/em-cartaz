import { useEffect, useState, type ReactNode } from 'react';
import { getSession, onAuthChange } from '../data/auth';
import LoginScreen from './LoginScreen';
import ResetPasswordScreen from './ResetPasswordScreen';

type Phase = 'loading' | 'signedOut' | 'signedIn' | 'recovery';

export default function AuthGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('loading');

  useEffect(() => {
    let active = true;
    // Link de recuperacao chega como #access_token=...&type=recovery na URL.
    const isRecoveryUrl = window.location.hash.includes('type=recovery');

    getSession()
      .then((s) => {
        if (!active) return;
        setPhase((prev) => {
          if (prev === 'recovery' || isRecoveryUrl) return 'recovery';
          return s !== null ? 'signedIn' : 'signedOut';
        });
      })
      .catch(() => {
        if (!active) return;
        setPhase((prev) => (prev === 'recovery' || isRecoveryUrl ? 'recovery' : 'signedOut'));
      });

    const unsubscribe = onAuthChange((state) => {
      if (!active) return;
      setPhase((prev) => {
        if (state === 'recovery') return 'recovery';
        if (state === 'signedOut') return 'signedOut';
        // state === 'signedIn': nao sai do modo recuperacao so porque existe
        // sessao; so sai quando a nova senha e salva (onDone) ou ao cancelar.
        return prev === 'recovery' ? 'recovery' : 'signedIn';
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-bg text-muted flex items-center justify-center">
        Carregando...
      </div>
    );
  }
  if (phase === 'recovery') {
    return <ResetPasswordScreen onDone={() => setPhase('signedIn')} />;
  }
  return phase === 'signedIn' ? <>{children}</> : <LoginScreen />;
}
