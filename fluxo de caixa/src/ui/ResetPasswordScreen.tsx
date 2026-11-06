import { useState, type FormEvent } from 'react';
import { updatePassword, signOut } from '../data/auth';

function friendlyError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('should be different') || msg.includes('different from the old'))
    return 'A nova senha precisa ser diferente da anterior.';
  if (msg.includes('at least') || msg.includes('weak') || msg.includes('6 characters'))
    return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token'))
    return 'Este link de redefinicao expirou. Peca um novo na tela de entrar.';
  if (msg.includes('fetch') || msg.includes('network')) return 'Sem conexao. Tente novamente.';
  return 'Nao foi possivel salvar a nova senha. Tente novamente.';
}

// Depois que a senha troca (ou cancela), limpa o #access_token=...type=recovery
// da URL, pra um reload nao reabrir essa tela sem motivo.
function clearRecoveryHash(): void {
  if (window.location.hash) {
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }
}

export default function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('As senhas nao sao iguais.');
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      clearRecoveryHash();
      onDone();
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
        <form onSubmit={onSubmit} className="glass relative z-10 w-full rounded-3xl p-6 space-y-4">
          <h1 className="text-2xl font-bold text-center tracking-tight">Nova senha</h1>
          <p className="text-sm text-muted text-center">Escolha uma senha nova pro seu Meu Caixa.</p>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={input}
          />
          {error && <p className="text-sm text-red">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-green py-2 font-semibold text-bg disabled:opacity-60"
          >
            {busy ? 'Salvando...' : 'Salvar nova senha'}
          </button>
          <button
            type="button"
            onClick={() => {
              clearRecoveryHash();
              signOut().catch(() => {});
            }}
            className="w-full text-sm text-muted hover:text-txt"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
