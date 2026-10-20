# Site Caldemat — Institucional + Gestão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um site institucional novo para a Caldemat e, atrás de login, uma área de gestão (matéria-prima, estoque, clientes, pedidos, funcionários) com permissões por usuário, tudo sobre Supabase e hospedado de graça.

**Architecture:** Uma única aplicação Vite+React servida estaticamente: a rota `/` é o site institucional público e `/app/*` é o painel protegido por login. Os dados e o login vivem no Supabase (Postgres + Auth); as permissões são aplicadas no banco por Row Level Security (RLS), não só escondendo botões. A criação de logins e o reset de senha pelo admin passam por uma Edge Function (server-side), porque exigem a chave de serviço.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS 3, react-router-dom 6, @supabase/supabase-js 2, Supabase (Postgres 15 + Auth + Edge Functions em Deno), Vitest 2 + @testing-library/react 16 + jsdom, pgTAP (via `supabase test db`) para testes de schema/RLS.

**Spec:** `docs/superpowers/specs/2026-10-20-site-caldemat-design.md`

## Global Constraints

- Toda a interface em **português (pt-BR)**.
- **Custo novo ~R$ 0/mês:** Supabase plano gratuito; frontend em host estático gratuito (Vercel).
- **Login de funcionário por usuário + senha, sem e-mail.** O usuário `joao` é mapeado para um e-mail sintético interno `joao@caldemat.local` de forma transparente. **Não há** recuperação de senha por e-mail.
- **Permissões aplicadas no banco (RLS)**, nunca apenas na UI.
- **Estoque = só matéria-prima.** Estoque e pedidos são **independentes** (vender não mexe no estoque).
- **Valores monetários** armazenados como `numeric(12,2)` (BRL); exibidos no formato pt-BR (R$ 1.234,56).
- **Responsivo**: funciona bem em celular e desktop.
- Node >= 20. Nenhuma biblioteca paga.
- Primeiro deploy em **endereço temporário** (subdomínio Vercel). A virada para caldemat.com.br fica pendente até haver acesso ao DNS (ver spec §11).

## Review Focus

- **Acesso direto por URL sem permissão:** um funcionário sem acesso a Pedidos que digita `/app/pedidos` (ou chama a tabela via supabase-js) deve receber **zero linhas / erro**, não os dados. Coberto pelo RLS em Task 3 e pela guarda de rota em Task 6.
- **Saída de estoque maior que o saldo:** deve ser **permitida com aviso visível**, nunca bloqueada nem silenciosa. Coberto em Task 8.
- **Dinheiro em pt-BR:** valor unitário digitado como `1.234,56`, total = qtd × unitário sem erro de centavo, total do pedido = soma dos itens. Coberto em Task 10.
- **Login inválido:** usuário inexistente ou senha errada mostram a **mesma** mensagem genérica ("usuário ou senha inválidos"), sem revelar qual falhou. Coberto em Task 5.
- **Lockout de admin:** o admin não pode remover/rebaixar o último admin e ficar sem nenhum. Coberto em Task 11.

---

## File Structure

Raiz do projeto: `SITE CALDEMAT/` (projeto Vite independente dentro do workspace).

- `index.html`, `package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`, `vitest.config.ts`, `.env.local` — configuração.
- `supabase/migrations/*.sql` — schema e RLS versionados.
- `supabase/functions/admin-users/index.ts` — Edge Function de gestão de usuários (criar, resetar senha, inativar).
- `supabase/tests/*.sql` — testes pgTAP de schema e RLS.
- `src/lib/supabase.ts` — cliente supabase-js.
- `src/lib/auth.ts` — login/logout/sessão + mapeamento usuário↔e-mail sintético.
- `src/lib/permissions.ts` — funções puras de permissão.
- `src/lib/money.ts` — parse/format de moeda pt-BR.
- `src/types.ts` — tipos compartilhados (Perfil, Material, Movimentacao, Cliente, Pedido, PedidoItem).
- `src/site/*` — site institucional (Header, Footer, Home, Empresa, Produtos, Servicos, Contato).
- `src/app/*` — painel: Login, RequireAuth, Dashboard (layout+nav), e uma pasta por módulo (`materiais/`, `estoque/`, `clientes/`, `pedidos/`, `funcionarios/`), cada uma com `*.api.ts` (acesso a dados) e `*Page.tsx` (tela).
- Testes colocados ao lado como `*.test.ts(x)`.

---

### Task 1: Scaffolding do projeto e ferramentas

**Files:**
- Create: `SITE CALDEMAT/package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.env.example`, `.gitignore`
- Create: `src/lib/supabase.ts`
- Test: `src/lib/supabase.test.ts`

**Interfaces:**
- Produces: `supabase` (cliente `SupabaseClient` exportado de `src/lib/supabase.ts`, lendo `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).

- [ ] **Step 1: Scaffold Vite+React+TS** com `npm create vite@5 . -- --template react-ts` na pasta `SITE CALDEMAT/`, instalar Tailwind, react-router-dom, @supabase/supabase-js, e Vitest + @testing-library/react + jsdom.
- [ ] **Step 2: Configurar Tailwind e Vitest** (`vitest.config.ts` com `environment: 'jsdom'`, `globals: true`, setup de testing-library). Configurar `tailwind.config.js` com os caminhos de `src/`.
- [ ] **Step 3: Escrever o teste que falha** em `src/lib/supabase.test.ts`:

```ts
import { supabase } from './supabase'
test('exporta um cliente supabase com auth', () => {
  expect(supabase).toBeDefined()
  expect(typeof supabase.auth.getSession).toBe('function')
})
```

- [ ] **Step 4: Rodar e ver falhar.** Run: `npm run test -- supabase.test.ts`. Esperado: FAIL (módulo não existe).
- [ ] **Step 5: Implementar `src/lib/supabase.ts`** criando o cliente com `createClient(url, anonKey)` a partir das envs. Criar `.env.example` com `VITE_SUPABASE_URL=` e `VITE_SUPABASE_ANON_KEY=`.
- [ ] **Step 6: Rodar e ver passar.** Run: `npm run test -- supabase.test.ts`. Esperado: PASS. Rodar `npm run build` e confirmar build ok.
- [ ] **Step 7: Commit.** `git add` do scaffold + `git commit -m "chore: scaffold Vite+React+TS+Tailwind+Supabase+Vitest"`.

---

### Task 2: Schema do banco (migração)

**Files:**
- Create: `supabase/migrations/0001_schema.sql`
- Test: `supabase/tests/0001_schema_test.sql`

**Interfaces:**
- Produces (tabelas/colunas que as próximas tasks consomem):
  - `perfis(id uuid pk = auth.uid, nome text, is_admin bool, pode_materia_prima bool, pode_estoque bool, pode_clientes bool, pode_pedidos bool, ativo bool default true)`
  - `materiais_prima(id uuid pk, nome text, unidade text, estoque_minimo numeric null, ativo bool default true)`
  - `movimentacoes_estoque(id uuid pk, material_id uuid fk, tipo text check in ('entrada','saida'), quantidade numeric check > 0, data timestamptz default now(), obs text null, usuario_id uuid)`
  - `clientes(id uuid pk, nome text, documento text null, telefone text null, email text null, endereco text null, obs text null, ativo bool default true)`
  - `pedidos(id uuid pk, cliente_id uuid fk, data timestamptz default now(), obs text null, usuario_id uuid)`
  - `pedido_itens(id uuid pk, pedido_id uuid fk on delete cascade, descricao text, quantidade numeric check > 0, valor_unitario numeric(12,2) check >= 0)`
  - View `saldo_estoque(material_id, nome, unidade, saldo)` = soma(entrada) − soma(saida).
  - View `pedidos_total(pedido_id, total)` = soma(quantidade × valor_unitario).

- [ ] **Step 1: Escrever o teste pgTAP que falha** em `supabase/tests/0001_schema_test.sql`: `has_table` para cada tabela; `has_view('saldo_estoque')`, `has_view('pedidos_total')`; e um teste de dados: inserir material + entrada 10 + saida 3 → `saldo` = 7; inserir pedido com itens (2×10,00) + (1×5,50) → `total` = 25,50.
- [ ] **Step 2: Rodar e ver falhar.** Run: `supabase test db`. Esperado: FAIL (tabelas/views ausentes).
- [ ] **Step 3: Escrever a migração** `0001_schema.sql` criando as tabelas, constraints e as duas views exatamente como no bloco Interfaces.
- [ ] **Step 4: Rodar e ver passar.** Run: `supabase test db`. Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(db): schema inicial + views de saldo e total"`.

---

### Task 3: RLS e modelo de permissões no banco

**Files:**
- Create: `supabase/migrations/0002_rls.sql`
- Test: `supabase/tests/0002_rls_test.sql`

**Interfaces:**
- Consumes: tabelas da Task 2.
- Produces: políticas RLS que condicionam cada tabela à flag correspondente em `perfis` do `auth.uid()`. Helper SQL `tem_permissao(modulo text) returns bool` lendo `perfis`.

- [ ] **Step 1: Escrever o teste pgTAP que falha** em `0002_rls_test.sql`, simulando papéis com `set local role` / `request.jwt.claims`: (a) usuário com `pode_pedidos=false` faz `select` em `pedidos` → **0 linhas**; (b) mesmo usuário com `pode_pedidos=true` → vê as linhas; (c) não-admin faz `select` em `perfis` de outro → 0 linhas; (d) admin vê todos os `perfis`. **Review Focus: acesso direto sem permissão.**
- [ ] **Step 2: Rodar e ver falhar.** Run: `supabase test db`. Esperado: FAIL (RLS ainda não força nada).
- [ ] **Step 3: Escrever `0002_rls.sql`**: `enable row level security` em todas as tabelas; função `tem_permissao`; políticas de select/insert/update por módulo; `perfis` legível/gravável só pelo próprio usuário e por admin.
- [ ] **Step 4: Rodar e ver passar.** Run: `supabase test db`. Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(db): RLS por permissão de módulo"`.

---

### Task 4: Tipos e permissões (puro)

**Files:**
- Create: `src/types.ts`, `src/lib/permissions.ts`, `src/lib/money.ts`
- Test: `src/lib/permissions.test.ts`, `src/lib/money.test.ts`

**Interfaces:**
- Produces:
  - `type Perfil` (espelha a tabela `perfis`), `Material`, `Movimentacao`, `Cliente`, `Pedido`, `PedidoItem`.
  - `type Modulo = 'materia_prima' | 'estoque' | 'clientes' | 'pedidos' | 'funcionarios'`
  - `podeAcessar(perfil: Perfil, modulo: Modulo): boolean` — admin acessa tudo (incl. `funcionarios`); demais seguem as flags; `funcionarios` só admin.
  - `parseMoedaBR(texto: string): number` ("1.234,56" → 1234.56; inválido → NaN).
  - `formatMoedaBR(n: number): string` (1234.56 → "R$ 1.234,56").

- [ ] **Step 1: Escrever os testes que falham.** `permissions.test.ts`: admin → true em todos os módulos; funcionário com só `pode_estoque` → true em estoque, false nos outros e em funcionarios. `money.test.ts`: `parseMoedaBR('1.234,56')===1234.56`, `parseMoedaBR('abc')` é NaN, `formatMoedaBR(1234.5)==='R$ 1.234,50'`. **Review Focus: dinheiro pt-BR.**
- [ ] **Step 2: Rodar e ver falhar.** Run: `npm run test -- permissions money`. Esperado: FAIL.
- [ ] **Step 3: Implementar** `types.ts`, `permissions.ts`, `money.ts` com as assinaturas acima.
- [ ] **Step 4: Rodar e ver passar.** Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: tipos, permissões puras e moeda pt-BR"`.

---

### Task 5: Autenticação por usuário + senha

**Files:**
- Create: `src/lib/auth.ts`, `src/app/Login.tsx`, `src/app/RequireAuth.tsx`
- Test: `src/lib/auth.test.ts`, `src/app/Login.test.tsx`

**Interfaces:**
- Consumes: `supabase` (Task 1), `Perfil`/`podeAcessar` (Task 4).
- Produces:
  - `usuarioParaEmail(usuario: string): string` → `${usuario.toLowerCase()}@caldemat.local`.
  - `entrar(usuario: string, senha: string): Promise<{erro?: string}>` — chama `signInWithPassword`; em erro retorna `{erro: 'Usuário ou senha inválidos'}` (mensagem única).
  - `sair(): Promise<void>`; `getPerfilAtual(): Promise<Perfil | null>`.
  - `<RequireAuth>`: redireciona para `/app/login` se sem sessão; expõe o `Perfil` carregado aos filhos (via context/outlet).

- [ ] **Step 1: Escrever os testes que falham** mockando `supabase.auth`. `auth.test.ts`: `usuarioParaEmail('Joao')==='joao@caldemat.local'`; `entrar` com erro do supabase retorna mensagem genérica. `Login.test.tsx`: enviar formulário chama `entrar`; ao retornar erro, mostra "Usuário ou senha inválidos" (sem dizer qual). **Review Focus: login inválido.**
- [ ] **Step 2: Rodar e ver falhar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** `auth.ts`, a tela `Login.tsx` (campos Usuário/Senha, pt-BR) e `RequireAuth.tsx`.
- [ ] **Step 4: Rodar e ver passar.** Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(app): login por usuário/senha + guarda de rota"`.

---

### Task 6: Shell do painel e navegação por permissão

**Files:**
- Create: `src/app/Dashboard.tsx`
- Modify: `src/App.tsx` (rotas `/app`, `/app/login`, e filhas protegidas)
- Test: `src/app/Dashboard.test.tsx`

**Interfaces:**
- Consumes: `RequireAuth`, `podeAcessar`, `Perfil`.
- Produces: layout com nav lateral/superior que renderiza **apenas as abas permitidas**; `<Outlet>` para as páginas de módulo; botão Sair.

- [ ] **Step 1: Escrever o teste que falha** `Dashboard.test.tsx`: com perfil só-estoque, a nav mostra "Estoque" e **não** mostra "Pedidos"/"Clientes"/"Funcionários"; com admin, mostra todas incl. "Funcionários". **Review Focus: acesso sem permissão (camada UI).**
- [ ] **Step 2: Rodar e ver falhar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** `Dashboard.tsx` e registrar rotas em `App.tsx` (institucional em `/`, painel em `/app/*` sob `RequireAuth`).
- [ ] **Step 4: Rodar e ver passar.** Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(app): shell do painel com nav por permissão"`.

---

### Task 7: Módulo Matéria-Prima

**Files:**
- Create: `src/app/materiais/materiais.api.ts`, `src/app/materiais/MateriaisPage.tsx`
- Test: `src/app/materiais/materiais.api.test.ts`, `MateriaisPage.test.tsx`

**Interfaces:**
- Consumes: `supabase`, `Material`.
- Produces: `listarMateriais()`, `criarMaterial(m)`, `editarMaterial(id, m)`, `inativarMaterial(id)` (todos Promise). Página com lista + formulário (nome, unidade, estoque mínimo opcional).

- [ ] **Step 1: Escrever testes que falham** mockando supabase: `criarMaterial` envia `{nome, unidade}` para `.from('materiais_prima').insert`; a página lista materiais e abre formulário de criação.
- [ ] **Step 2: Rodar e ver falhar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** api + página (pt-BR, responsiva).
- [ ] **Step 4: Rodar e ver passar.** Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(app): cadastro de matéria-prima"`.

---

### Task 8: Módulo Estoque

**Files:**
- Create: `src/app/estoque/estoque.api.ts`, `src/app/estoque/EstoquePage.tsx`
- Test: `estoque.api.test.ts`, `EstoquePage.test.tsx`

**Interfaces:**
- Consumes: `supabase`, `saldo_estoque` (view), `Material`, `Movimentacao`.
- Produces: `listarSaldos()`, `registrarMovimentacao({material_id, tipo, quantidade, obs?})`, `historicoPorMaterial(id)`. Página: tabela de saldos + formulário de entrada/saída + histórico.

- [ ] **Step 1: Escrever testes que falham**: `listarSaldos` lê a view; registrar saída cujo `quantidade > saldo` **não lança erro** e a página mostra **aviso** "Saldo ficará negativo", mas **permite** confirmar. **Review Focus: saída > saldo (aviso, não bloqueio).**
- [ ] **Step 2: Rodar e ver falhar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** api + página com o aviso não-bloqueante.
- [ ] **Step 4: Rodar e ver passar.** Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(app): estoque com entradas/saídas e aviso de saldo negativo"`.

---

### Task 9: Módulo Clientes

**Files:**
- Create: `src/app/clientes/clientes.api.ts`, `src/app/clientes/ClientesPage.tsx`
- Test: `clientes.api.test.ts`, `ClientesPage.test.tsx`

**Interfaces:**
- Consumes: `supabase`, `Cliente`.
- Produces: `listarClientes()`, `criarCliente(c)`, `editarCliente(id, c)`, `inativarCliente(id)`. Página com lista + formulário.

- [ ] **Step 1: Escrever testes que falham**: `criarCliente` insere em `clientes`; página lista e cria. 
- [ ] **Step 2: Rodar e ver falhar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** api + página.
- [ ] **Step 4: Rodar e ver passar.** Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(app): cadastro de clientes"`.

---

### Task 10: Módulo Pedidos

**Files:**
- Create: `src/app/pedidos/pedidos.api.ts`, `src/app/pedidos/PedidosPage.tsx`
- Test: `pedidos.api.test.ts`, `PedidosPage.test.tsx`

**Interfaces:**
- Consumes: `supabase`, `pedidos_total` (view), `Cliente`, `Pedido`, `PedidoItem`, `parseMoedaBR`/`formatMoedaBR`.
- Produces: `criarPedido({cliente_id, obs?, itens: {descricao, quantidade, valor_unitario}[]})` (insere pedido + itens), `listarPedidos()` (com total), `obterPedido(id)`, `editarPedido(id, ...)`. Página: novo pedido (seleciona cliente, adiciona itens, total ao vivo), lista com busca por cliente/data.

- [ ] **Step 1: Escrever testes que falham**: total do item = `quantidade × valor_unitario`; total do pedido = soma dos itens; entrada "1.234,56" no valor unitário vira 1234.56 ao salvar; a lista exibe o total formatado em R$. **Review Focus: dinheiro pt-BR.**
- [ ] **Step 2: Rodar e ver falhar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** api + página (itens dinâmicos, total ao vivo).
- [ ] **Step 4: Rodar e ver passar.** Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat(app): pedidos com itens e totais em BRL"`.

---

### Task 11: Funcionários + Edge Function de gestão de usuários

**Files:**
- Create: `supabase/functions/admin-users/index.ts`
- Create: `src/app/funcionarios/funcionarios.api.ts`, `src/app/funcionarios/FuncionariosPage.tsx`
- Test: `supabase/functions/admin-users/index.test.ts` (Deno), `FuncionariosPage.test.tsx`

**Interfaces:**
- Consumes: `supabase`, `Perfil`, `podeAcessar` (admin-only).
- Produces:
  - Edge Function `admin-users` com ações: `criar({usuario, senha, nome, permissoes})` (cria no Auth com e-mail sintético + grava `perfis`), `resetar_senha({id, nova_senha})`, `inativar({id})`. Exige que o chamador seja admin (verifica via JWT + `perfis`). Impede remover/rebaixar o último admin → retorna erro `ultimo_admin`.
  - `funcionarios.api.ts`: wrappers que invocam a function; `listarFuncionarios()` lê `perfis`.
  - Página admin: lista, formulário de cadastro com checkboxes de permissão por módulo, botão "Resetar senha", botão "Inativar".

- [ ] **Step 1: Escrever testes que falham.** Deno test: chamador não-admin → 403; criar usuário grava e-mail sintético e permissões; `inativar` do último admin → erro `ultimo_admin`. **Review Focus: lockout de admin.** Component test: `FuncionariosPage` não renderiza para não-admin; formulário tem um checkbox por módulo.
- [ ] **Step 2: Rodar e ver falhar.** Run: `deno test` + `npm run test -- FuncionariosPage`. Esperado: FAIL.
- [ ] **Step 3: Implementar** a Edge Function (usando `SERVICE_ROLE_KEY` do ambiente da function) e a página.
- [ ] **Step 4: Rodar e ver passar.** Esperado: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: gestão de funcionários (Edge Function + tela admin)"`.

---

### Task 12: Site institucional

**Files:**
- Create: `src/site/Header.tsx`, `Footer.tsx`, `Home.tsx`, `Empresa.tsx`, `Produtos.tsx`, `Servicos.tsx`, `Contato.tsx`
- Modify: `src/App.tsx` (rota `/` com as seções)
- Test: `src/site/Site.test.tsx`

**Interfaces:**
- Consumes: react-router `Link`.
- Produces: página pública única (uma rota, seções roláveis) com Header fixo contendo o botão **Login** que leva a `/app/login`.

- [ ] **Step 1: Escrever o teste que falha** `Site.test.tsx`: renderiza as seções (Empresa, Produtos, Serviços, Contato) e um link "Login" cujo destino é `/app/login`; o rodapé mostra WhatsApp (65) 99359-7968 e Instagram.
- [ ] **Step 2: Rodar e ver falhar.** Esperado: FAIL.
- [ ] **Step 3: Implementar** as seções com visual moderno (Tailwind), responsivo, usando conteúdo da Caldemat. Direção visual: moderno e limpo (ver spec §4). Conteúdo final (fotos em alta/textos) é placeholder até coleta.
- [ ] **Step 4: Rodar e ver passar.** Esperado: PASS. Verificar `npm run build`.
- [ ] **Step 5: Commit.** `git commit -m "feat(site): institucional novo com botão de login"`.

---

### Task 13: Deploy em endereço temporário + relatório dos caminhos

**Files:**
- Create: `vercel.json` (SPA rewrites para `/app/*`), `README.md` (como rodar/local), `docs/relatorio-dos-caminhos-caldemat.md`
- Create: `supabase/seed_admin.sql` ou script documentado para semear o admin

**Interfaces:**
- Consumes: todo o app.

- [ ] **Step 1:** Criar projeto Supabase (conta do dev), aplicar migrações (`supabase db push`), publicar a Edge Function (`supabase functions deploy admin-users`), e semear o **primeiro admin** (`perfis.is_admin=true`).
- [ ] **Step 2:** Configurar `vercel.json` com rewrite SPA e as variáveis `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`; fazer deploy no Vercel (endereço temporário).
- [ ] **Step 3: Verificação manual (fim-a-fim) no endereço publicado:** entrar como admin; criar um funcionário só-estoque; confirmar que ele vê só Estoque; cadastrar material, dar entrada/saída (incl. saída > saldo mostra aviso); cadastrar cliente; criar pedido com 2 itens e conferir total; resetar a senha do funcionário. Registrar o resultado de cada passo.
- [ ] **Step 4:** Escrever `docs/relatorio-dos-caminhos-caldemat.md` (o **relatório dos caminhos** pro cliente): endereços de acesso (site e painel), login do admin, passo a passo de cada aba, como criar funcionários/permissões, onde os dados ficam (Supabase, propriedade do cliente) e o que falta para a virada do domínio. Anotar a pendência de transferir a conta para o cliente.
- [ ] **Step 5: Commit.** `git commit -m "chore: deploy temporário + relatório dos caminhos"`.

---

## Notas de execução
- Tasks 2 e 3 precisam do Supabase CLI local (`supabase start`) para `supabase test db`.
- Tasks 1 e 13 têm passos não cobertos por teste automatizado (scaffold, deploy, seed); por isso a Task 13 traz a verificação manual fim-a-fim explícita.
- A virada de DNS do caldemat.com.br fica fora deste plano (pendência externa, spec §11).
