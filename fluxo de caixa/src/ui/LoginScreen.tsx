import { useState, type FormEvent } from 'react';
import { signIn, signUp } from '../data/auth';

function friendlyError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('already registered')) return 'Este e-mail já está cadastrado.';
  if (msg.includes('password') && msg.includes('at least')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('invalid email') || msg.includes('valid email')) return 'E-mail inválido.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Muitas tentativas. Aguarde um pouco.';
  if (msg.includes('fetch') || msg.includes('network')) return 'Sem conexão. Tente novamente.';
  return 'Não foi possível concluir. Tente novamente.';
}

export default function LoginScreen() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === 'in') await signIn(email.trim(), password);
      else {
        await signUp(email.trim(), password);
        setInfo('Pronto, sua conta foi criada! Se pedir, confirme o e-mail e entre.');
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const input =
    'w-full rounded-lg border border-line bg-bg px-3 py-2 text-txt placeholder:text-muted focus:outline-none focus:border-blue';

  return (
    <div className="space-bg min-h-screen text-txt flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="glow-orb" aria-hidden />
        <form onSubmit={onSubmit} className="glass relative z-10 w-full p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center tracking-tight">Meu Caixa</h1>
        <p className="text-sm text-muted text-center">
          {mode === 'in' ? 'Que bom te ver. Vamos ao seu caixa?' : 'Vamos criar seu caixa. É rapidinho.'}
        </p>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        {error && <p className="text-sm text-red">{error}</p>}
        {info && <p className="text-sm text-green">{info}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-green py-2 font-semibold text-bg disabled:opacity-60"
        >
          {busy ? 'Aguarde...' : mode === 'in' ? 'Entrar agora' : 'Criar minha conta'}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'in' ? 'up' : 'in');
            setError(null);
            setInfo(null);
          }}
          className="w-full text-sm text-muted hover:text-txt"
        >
          {mode === 'in' ? 'É sua primeira vez? Crie sua conta' : 'Já tem conta? Entrar'}
        </button>
        </form>
      </div>
    </div>
  );
}
