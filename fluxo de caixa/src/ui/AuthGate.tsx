import { useEffect, useState, type ReactNode } from 'react';
import { getSession, onAuthChange } from '../data/auth';
import LoginScreen from './LoginScreen';

export default function AuthGate({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    getSession()
      .then((s) => {
        if (active) setSignedIn((prev) => prev ?? s !== null);
      })
      .catch(() => {
        if (active) setSignedIn((prev) => prev ?? false);
      });
    const unsubscribe = onAuthChange((v) => {
      if (active) setSignedIn(v);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (signedIn === null) {
    return (
      <div className="min-h-screen bg-bg text-muted flex items-center justify-center">
        Carregando...
      </div>
    );
  }
  return signedIn ? <>{children}</> : <LoginScreen />;
}
