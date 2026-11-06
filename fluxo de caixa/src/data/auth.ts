import { supabase } from './supabase';

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  // scope: 'local' clears this device's session immediately without waiting on
  // a server-side global revoke that can fail/hang and leave the user stuck.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Envia o e-mail de redefinicao. O link volta para a origem atual do app
// (localhost em dev, ou a URL de onde o PWA foi instalado no celular), entao
// funciona em qualquer lugar sem URL fixa no codigo.
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

// Define a senha nova do usuario que ja esta autenticado pelo link de recuperacao.
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export type AuthState = 'signedIn' | 'signedOut' | 'recovery';

export function onAuthChange(cb: (state: AuthState) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') cb('recovery');
    else cb(session !== null ? 'signedIn' : 'signedOut');
  });
  return () => data.subscription.unsubscribe();
}
