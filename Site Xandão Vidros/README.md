# Caldemat — site + painel

Site institucional público (`/`) e painel interno (`/app`) da Caldemat, com login por usuário e senha e módulos de Matéria-Prima, Estoque, Clientes, Pedidos e Funcionários (admin). Stack: Vite + React + TypeScript + Tailwind; backend Supabase (Postgres, Auth, RLS, Edge Function).

## Rodar localmente

```bash
npm install
# crie .env.local com:
#   VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
#   VITE_SUPABASE_ANON_KEY=<anon key>
npm run dev     # desenvolvimento
npm run test    # testes
npm run build   # build de produção (dist/)
```

## Estrutura

- `/` site público; `/app` painel (login em `/app/login`)
- `src/site` site, `src/app` painel (um diretório por módulo), `src/lib` auth/cliente Supabase
- `supabase/migrations` (0001 schema, 0002 RLS), `supabase/functions/admin-users` (gestão de funcionários, usa service role), `supabase/seed_admin.sql`
- `vercel.json`: rewrite SPA (todas as rotas vão para `/index.html`)
- `docs/relatorio-dos-caminhos.md`: guia para o cliente

## Setup na nuvem (passo a passo)

**a) Criar o projeto Supabase** em supabase.com (anote a senha do banco).

**b) Aplicar as migrations**, nesta ordem:
- com CLI: `supabase login`, `supabase link --project-ref <ref>`, `supabase db push`; ou
- colando no SQL Editor: primeiro `supabase/migrations/0001_schema.sql`, depois `0002_rls.sql`.

**c) Publicar a Edge Function:**
```bash
supabase functions deploy admin-users
supabase secrets set SERVICE_ROLE_KEY=<service_role key>
```
O Supabase rejeita nomes de secret que começam com `SUPABASE_`, por isso o nome é `SERVICE_ROLE_KEY` (a função já o usa como alternativa). A chave de service role pode já ser injetada pela plataforma; este comando só é necessário se a função não conseguir lê-la. A chave fica em Project Settings > API. Nunca a coloque no front-end nem no Vercel. `SUPABASE_URL` e `SUPABASE_ANON_KEY` já são injetadas pelo Supabase nas Edge Functions.

**d) Semear o primeiro admin:** em Authentication > Users crie `admin@caldemat.local` com senha (Auto Confirm); depois rode `supabase/seed_admin.sql` no SQL Editor (usa o id do usuário do Auth como `perfis.id` e marca `is_admin` e todos os `pode_*`).

**d2) Cadastro público:** em Authentication > Sign In / Providers, desative "Allow new users to sign up" para evitar usuários `*.local` indesejados.

**Sem administrador?** No Supabase: Authentication > Users > remova o banimento (Unban) do admin e rode `supabase/seed_admin.sql` no SQL Editor. Detalhes em `docs/relatorio-dos-caminhos.md`.

**e) Pegar URL + anon key** (Project Settings > API) para as variáveis abaixo.

**f) Deploy no Vercel:** importe o repositório (Root Directory: `Site caldemat`, framework Vite), configure as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (usadas no build; não coloque segredos no código) e faça o deploy. Teste em `<url>/app/login`.

**g) Domínio:** depois, em Vercel > Domains adicione `caldemat.com.br` e aponte o DNS (registros indicados pela Vercel) no Registro.br. Pendente de DNS.

### Checklist de verificação fim-a-fim (na URL publicada)

1. Entrar como admin.
2. Criar um funcionário só com Estoque; entrar com ele e confirmar que vê só Estoque.
3. Cadastrar material; dar entrada e saída (saída acima do saldo mostra aviso, mas registra).
4. Cadastrar cliente.
5. Criar pedido com 2 itens e conferir o total.
6. Resetar a senha do funcionário e entrar com a nova.
