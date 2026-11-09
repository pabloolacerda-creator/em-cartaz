# Xandão Vidros — site + painel

Site institucional público (`/`) e painel interno (`/app`) da Xandão Vidros, com login por usuário e senha e módulos de Matéria-Prima, Estoque, Clientes, Catálogo (Produtos/Serviços), Pedidos/Orçamentos e Financeiro. Stack: Vite + React + TypeScript + Tailwind; backend Supabase (Postgres, Auth, RLS, Edge Function). O acesso ao painel é de um único administrador (o Xandão).

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
- `supabase/migrations` (0001 schema, 0002 RLS, ... 0009), `supabase/functions/admin-users` (gestão de usuários, usa service role), `supabase/seed_admin.sql`
- `vercel.json`: rewrite SPA (todas as rotas vão para `/index.html`)
- `docs/relatorio-dos-caminhos.md`: guia para o cliente

## Setup na nuvem (passo a passo)

**a) Criar o projeto Supabase** em supabase.com (anote a senha do banco).

**b) Aplicar as migrations**, em ordem (0001 → 0009):
- com CLI: `supabase login`, `supabase link --project-ref <ref>`, `supabase db push`; ou
- colando no SQL Editor cada arquivo de `supabase/migrations/` na ordem numérica.

**c) Publicar a Edge Function:**
```bash
supabase functions deploy admin-users
supabase secrets set SERVICE_ROLE_KEY=<service_role key>
```
O Supabase rejeita nomes de secret que começam com `SUPABASE_`, por isso o nome é `SERVICE_ROLE_KEY` (a função já o usa como alternativa). A chave de service role fica em Project Settings > API. Nunca a coloque no front-end nem no Vercel.

**d) Semear o administrador:** em Authentication > Users crie `admin@xandaovidros.local` com senha (Auto Confirm); depois rode `supabase/seed_admin.sql` no SQL Editor.

**d2) Cadastro público:** em Authentication > Sign In / Providers, desative "Allow new users to sign up" para evitar usuários `*.local` indesejados.

**Sem administrador?** No Supabase: Authentication > Users > remova o banimento (Unban) do admin e rode `supabase/seed_admin.sql` no SQL Editor. Detalhes em `docs/relatorio-dos-caminhos.md`.

**e) Pegar URL + anon key** (Project Settings > API) para as variáveis abaixo.

**f) Deploy no Vercel:** importe o repositório (Root Directory: `Site Xandão Vidros`, framework Vite), configure as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e faça o deploy. Teste em `<url>/app/login`.

**g) Domínio (opcional):** em Vercel > Domains adicione o domínio próprio e aponte o DNS conforme indicado pela Vercel.

### Checklist de verificação fim-a-fim (na URL publicada)

1. Entrar como admin.
2. Cadastrar um tipo de vidro em Produtos/Serviços (unidade m², preço por m²).
3. Cadastrar um cliente.
4. Criar um orçamento com um item de vidro (largura × altura) e conferir o total em m².
5. Imprimir/salvar o PDF do orçamento (com o timbrado).
6. Aprovar e faturar o pedido; conferir a conta a receber no Financeiro.
