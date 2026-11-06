// Redefine a senha de um usuário do Supabase via Admin API.
// Mantém a MESMA conta (mesmo id) -> todos os lançamentos continuam acessíveis.
// A service_role key nunca é impressa; o script só mostra sucesso/erro.
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
const email = process.env.RESET_EMAIL;
const newPassword = process.env.RESET_NEW_PASSWORD;

if (!url || !serviceKey || !email || !newPassword) {
  console.error('Faltando variaveis. Precisa de: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE, RESET_EMAIL, RESET_NEW_PASSWORD (em .env.local).');
  process.exit(1);
}
if (newPassword.length < 6) {
  console.error('A senha nova precisa ter pelo menos 6 caracteres.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

// Procura o usuario pelo e-mail (paginando se preciso).
let user = null;
for (let page = 1; !user; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) { console.error('Erro ao listar usuarios:', error.message); process.exit(1); }
  user = data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
  if (user || data.users.length < 1000) break;
}

if (!user) {
  console.error('Nenhum usuario com o e-mail "' + email + '" foi encontrado neste projeto.');
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
if (error) { console.error('Erro ao trocar a senha:', error.message); process.exit(1); }

console.log('OK! Senha redefinida para ' + email + ' (id ' + user.id + '). Seus dados foram preservados.');
