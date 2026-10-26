# Caldemat — LP de Orçamento + aba Leads + conversão Google Ads — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar à Caldemat uma Landing Page pública de orçamento que capta leads qualificados de abastecimento agrícola, grava-os no sistema de gestão existente numa nova aba "Leads", e dispara a conversão do Google Ads no envio do formulário.

**Architecture:** Estende o app atual (React + Vite SPA + Supabase). Nova tabela `leads` com RLS (inserção pública anônima; leitura/edição só com permissão `pode_leads`), nova LP pública em `/orcamento`, nova aba `/app/leads` na área de gestão (mesmo padrão de módulo/permissão das demais), e um disparo de conversão gtag no envio bem-sucedido do formulário. Nada de API do Google Ads — a campanha em si é configurada no painel seguindo um playbook (Task 6).

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind 3, react-router-dom 6, @supabase/supabase-js 2, Supabase (Postgres 15 + Auth), Vitest 2 + @testing-library/react 16 + jsdom, pgTAP via `supabase test db`.

**Spec:** `docs/superpowers/specs/2026-10-26-caldemat-google-ads-lp-design.md`

## Global Constraints

- Idioma de toda a interface: **pt-BR**.
- Segurança no banco (**RLS**), não só escondendo botões: inserção de lead é pública (anônima), mas **leitura/edição** exige `pode_leads` (ou admin). Anônimo **nunca lê** leads.
- Seguir os padrões já existentes do repo: módulos via `type Modulo` + `podeAcessar` + `RequireModulo`; APIs em `*.api.ts` com `unwrap`; migrations numeradas sequenciais; permissões geridas pela Edge Function `admin-users`.
- Documento do lead aceita **CPF ou CNPJ** (não exigir CNPJ puro). Capacidade é **número livre em litros** (sem faixas).
- `criarLead` é chamado por usuário **anônimo** → o insert **não pode** encadear `.select()` (anon não tem policy de select; RETURNING falharia).
- Só **Search** no Google Ads; só a frente de **abastecimento agrícola** nesta entrega.

## Review Focus

- **Anônimo lê/enumera leads** (vazamento de dados de contato): RLS deve retornar 0 linhas para `anon` em `select` → coberto no teste pgTAP da Task 1.
- **Bot de spam** envia o formulário (honeypot preenchido): a LP deve descartar silenciosamente, sem criar lead → teste na Task 4.
- **Envio sem campos obrigatórios** (nome/WhatsApp/cidade vazios): a LP valida e não insere → teste na Task 4.
- **Funcionário comum tenta se dar `pode_leads`** (escalada de privilégio): trigger `perfis_bloqueia_escalada` deve barrar → teste pgTAP na Task 1.
- **Capacidade com texto não-numérico**: a LP converte para número ou `null`, sem quebrar → teste na Task 4.

---

### Task 1: Banco — permissão `pode_leads`, tabela `leads` e RLS (migration 0010)

**Files:**
- Create: `supabase/migrations/0010_leads.sql`
- Test: `supabase/tests/0010_leads_test.sql`

**Interfaces:**
- Produces (SQL): tabela `public.leads` com colunas `id uuid pk default gen_random_uuid()`, `criado_em timestamptz not null default now()`, `nome text not null`, `whatsapp text not null`, `documento text`, `capacidade_litros numeric`, `bacia_contencao boolean`, `cidade text`, `status text not null default 'novo' check (status in ('novo','contatado','ganho','perdido'))`, `utm_source text`, `utm_medium text`, `utm_campaign text`, `obs text`. Coluna `perfis.pode_leads boolean not null default false`. `tem_permissao('leads')` reconhecida.

- [ ] **Step 1: Escrever o teste pgTAP que falha** em `supabase/tests/0010_leads_test.sql` (mesmo esqueleto de `0002_rls_test.sql`: `begin; create extension pgtap; select plan(N); … rollback;`). Fixtures: usuário comum `d1` (sem flags) e admin `d2`. Casos:
  - como `anon`: `insert into public.leads (nome, whatsapp) values ('Teste','65999')` **passa** (1 linha afetada) — `lives_ok`.
  - como `anon`: `select count(*) from public.leads` = **0** (`is(... ,0)`) — anon não lê.
  - como `d1` (`pode_leads=false`): `select count(*) from public.leads` = **0**.
  - como `d1` com `pode_leads=true` (setado via superusuário): `select count(*)` = **nº de linhas inseridas** e `update public.leads set status='contatado'` **passa**.
  - como `d1` (não-admin): `update public.perfis set pode_leads=true where id=d1` **lança** `'apenas administradores podem alterar permissões'` (`throws_ok`).
- [ ] **Step 2: Rodar e ver falhar.** Run: `supabase test db`. Esperado: FAIL (tabela/coluna/policy ausentes).
- [ ] **Step 3: Escrever a migration** `0010_leads.sql`:
  - `alter table public.perfis add column if not exists pode_leads boolean not null default false;`
  - `create or replace function public.tem_permissao(modulo text)` — **copiar a versão atual de `0006_financeiro.sql`** e acrescentar a linha `when 'leads' then p.pode_leads`.
  - `create or replace function public.perfis_bloqueia_escalada()` — copiar a versão atual de `0006` e acrescentar `or new.pode_leads is distinct from old.pode_leads` à condição.
  - `create table public.leads (...)` com as colunas da seção Interfaces; `create index leads_criado_em_idx on public.leads (criado_em desc);`
  - `alter table public.leads enable row level security;`
  - Policies: `leads_insert_anon` → `for insert to anon with check (true)`; `leads_insert_auth` → `for insert to authenticated with check (true)`; `leads_select` → `for select to authenticated using (public.tem_permissao('leads'))`; `leads_update` → `for update to authenticated using (public.tem_permissao('leads')) with check (public.tem_permissao('leads'))`. (Sem policy de delete.)
- [ ] **Step 4: Rodar e ver passar.** Run: `supabase test db`. Esperado: PASS.
- [ ] **Step 5: Commit.**
```bash
git add supabase/migrations/0010_leads.sql supabase/tests/0010_leads_test.sql
git commit -m "feat(leads): tabela leads com RLS (insert anônimo, leitura por pode_leads)"
```

---

### Task 2: Permissão `pode_leads` no front e na gestão de usuários

**Files:**
- Modify: `src/types.ts` (type `Perfil`, type `Modulo`)
- Modify: `src/lib/permissions.ts`
- Modify: `src/lib/permissions.test.ts`
- Modify: `src/app/funcionarios/funcionarios.api.ts` (type `Permissoes`)
- Modify: `src/app/funcionarios/FuncionariosPage.tsx` (`MODULOS`, `PERMS_VAZIAS`)
- Modify: `supabase/functions/admin-users/index.ts` (`PERMS`)

**Interfaces:**
- Consumes: `type Modulo` e `podeAcessar` do repo.
- Produces: `Modulo` inclui `'leads'`; `Perfil` tem `pode_leads: boolean`; `podeAcessar(perfil, 'leads')` retorna `perfil.pode_leads` (admin ativo sempre true; inativo sempre false); `Permissoes` inclui `pode_leads`.

- [ ] **Step 1: Estender o teste** `src/lib/permissions.test.ts`: adicionar `pode_leads: false` ao `base`; incluir `'leads'` no array `todos`; adicionar `expect(podeAcessar({ ...base, pode_leads: true }, 'leads')).toBe(true)` no caso "cada flag libera seu módulo".
- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/lib/permissions.test.ts`. Esperado: FAIL (type/cases).
- [ ] **Step 3: Implementar:**
  - `src/types.ts`: adicionar `pode_leads: boolean` ao `Perfil`; adicionar `'leads'` à união `Modulo`.
  - `src/lib/permissions.ts`: adicionar `case 'leads': return perfil.pode_leads`.
  - `funcionarios.api.ts`: adicionar `pode_leads: boolean` ao type `Permissoes`.
  - `FuncionariosPage.tsx`: adicionar `{ chave: 'pode_leads', rotulo: 'Leads' }` a `MODULOS` e `pode_leads: false` a `PERMS_VAZIAS`.
  - `admin-users/index.ts`: adicionar `'pode_leads'` ao array `PERMS`.
- [ ] **Step 4: Rodar e ver passar.** Run: `npx vitest run src/lib/permissions.test.ts`. Esperado: PASS.
- [ ] **Step 5: Commit.**
```bash
git add src/types.ts src/lib/permissions.ts src/lib/permissions.test.ts src/app/funcionarios supabase/functions/admin-users/index.ts
git commit -m "feat(leads): permissão pode_leads em perfis, permissions e gestão de usuários"
```

---

### Task 3: API de leads (`leads.api.ts`)

**Files:**
- Create: `src/app/leads/leads.api.ts`
- Create: `src/app/leads/leads.api.test.ts`
- Modify: `src/types.ts` (types `Lead`, `StatusLead`)

**Interfaces:**
- Consumes: `supabase` de `src/lib/supabase`.
- Produces:
  - `type StatusLead = 'novo' | 'contatado' | 'ganho' | 'perdido'` e `type Lead` (em `types.ts`) com as colunas da tabela.
  - `type LeadInput = { nome: string; whatsapp: string; documento?: string | null; capacidade_litros?: number | null; bacia_contencao?: boolean | null; cidade?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; obs?: string | null }`
  - `criarLead(l: LeadInput): Promise<void>` — `supabase.from('leads').insert(l)` **sem `.select()`**; lança em erro.
  - `listarLeads(): Promise<Lead[]>` — `select('*').order('criado_em', { ascending: false })`.
  - `atualizarStatusLead(id: string, status: StatusLead): Promise<void>` — `update({ status }).eq('id', id)`.
  - `lerUtms(search: string): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null }` — lê de uma query string via `URLSearchParams`; ausentes viram `null`.

- [ ] **Step 1: Escrever os testes que falham** em `leads.api.test.ts` (padrão de `clientes.api.test.ts`, com o mesmo helper `thenable` e mock de `../../lib/supabase`):
  - `criarLead insere em leads e NÃO chama select`: `from` chamado com `'leads'`, `q.insert` chamado com o payload, e `expect(q.select).not.toHaveBeenCalled()`.
  - `listarLeads ordena por criado_em desc`: `q.order` chamado com `('criado_em', { ascending: false })`.
  - `atualizarStatusLead atualiza status por id`: `q.update` com `{ status: 'contatado' }`, `q.eq` com `('id','L1')`.
  - `lerUtms`: `lerUtms('?utm_source=google&utm_medium=cpc')` → `{ utm_source:'google', utm_medium:'cpc', utm_campaign:null }`.
  - `lança quando supabase retorna erro` (como no exemplo de clientes).
- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/app/leads/leads.api.test.ts`. Esperado: FAIL (módulo não existe).
- [ ] **Step 3: Implementar** `leads.api.ts` com as assinaturas acima (reusar o helper `unwrap` no mesmo formato do `clientes.api.ts`) e os types em `types.ts`.
- [ ] **Step 4: Rodar e ver passar.** Run: `npx vitest run src/app/leads/leads.api.test.ts`. Esperado: PASS.
- [ ] **Step 5: Commit.**
```bash
git add src/app/leads/leads.api.ts src/app/leads/leads.api.test.ts src/types.ts
git commit -m "feat(leads): API criarLead/listarLeads/atualizarStatusLead + lerUtms"
```

---

### Task 4: LP pública de Orçamento (`/orcamento`) + disparo de conversão

**Files:**
- Create: `src/site/Orcamento.tsx`
- Create: `src/site/Orcamento.test.tsx`
- Create: `src/lib/gads.ts`
- Modify: `src/App.tsx` (rota `/orcamento`)
- Modify: `src/site/Header.tsx` (botão "Orçamento" → `Link to="/orcamento"`)

**Interfaces:**
- Consumes: `criarLead`, `lerUtms` (Task 3); `WHATSAPP_URL`/`TELEFONE` de `src/site/dados`.
- Produces:
  - `src/lib/gads.ts`: `GADS_ID = import.meta.env.VITE_GADS_ID || ''`; `GADS_LABEL_LEAD = import.meta.env.VITE_GADS_LABEL_LEAD || ''`; `initGads(): void` (injeta o script gtag uma única vez quando `GADS_ID` está setado); `dispararConversaoLead(): void` (chama `window.gtag('event','conversion',{ send_to: \`${GADS_ID}/${GADS_LABEL_LEAD}\` })` quando configurado; no-op silencioso quando não).
  - `Orcamento` (default export): página pública com cabeçalho enxuto (logo + telefone), hero, foto, provas, e o formulário. Campos: **Nome**, **WhatsApp**, **CPF ou CNPJ**, **Capacidade (litros)**, **Bacia de contenção?** (Sim/Não), **Para qual cidade?**. Campo honeypot escondido `empresa_site` (label `.sr-only`, `tabIndex=-1`, `autoComplete="off"`).

- [ ] **Step 1: Escrever os testes que falham** em `Orcamento.test.tsx` (@testing-library/react; mockar `./leads.api`? — a página importa de `../app/leads/leads.api`; mockar esse módulo e `../lib/gads`). Casos:
  - **Submit válido** preenche nome/WhatsApp/cidade (+ capacidade "5000", bacia "Sim") e clica "Quero meu orçamento" → `criarLead` chamado uma vez com `capacidade_litros: 5000`, `bacia_contencao: true`, e os textos; depois `dispararConversaoLead` chamado; e aparece a mensagem de confirmação.
  - **Honeypot preenchido** → `criarLead` **não** é chamado (`expect(criarLead).not.toHaveBeenCalled()`), mas a UI mostra confirmação (não entrega pista ao bot).
  - **Campos obrigatórios vazios** (sem nome) → `criarLead` **não** chamado; aparece alerta de validação.
  - **Capacidade não-numérica** ("abc") → `criarLead` chamado com `capacidade_litros: null` (não quebra).
- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/site/Orcamento.test.tsx`. Esperado: FAIL (componente não existe).
- [ ] **Step 3: Implementar:**
  - `gads.ts` conforme Interfaces.
  - `Orcamento.tsx`: estado de formulário (padrão `useState` como `ClientesPage`), validação de obrigatórios (nome, WhatsApp, cidade), parse de capacidade (`const n = parseFloat(cap.replace(',','.')); capacidade_litros = Number.isFinite(n) ? n : null`), honeypot (se preenchido, pular `criarLead` e mostrar sucesso), `lerUtms(window.location.search)` no submit, chamada `criarLead`, depois `dispararConversaoLead()`, e tela de confirmação. Chamar `initGads()` em `useEffect` no mount. Visual conforme o mockup aprovado (cabeçalho enxuto, cor de marca `brand`/emerald, botão verde).
  - `App.tsx`: importar `Orcamento` e adicionar `{ path: '/orcamento', element: <Orcamento /> }` à lista de rotas (irmã de `/`).
  - `Header.tsx`: trocar o `<a href={WHATSAPP_URL}>Orçamento</a>` por `<Link to="/orcamento" className="...mesmas classes...">Orçamento</Link>` (manter visual).
- [ ] **Step 4: Rodar e ver passar.** Run: `npx vitest run src/site/Orcamento.test.tsx`. Esperado: PASS.
- [ ] **Step 5: Commit.**
```bash
git add src/site/Orcamento.tsx src/site/Orcamento.test.tsx src/lib/gads.ts src/App.tsx src/site/Header.tsx
git commit -m "feat(lp): LP /orcamento com formulário qualificador e conversão Google Ads"
```

---

### Task 5: Aba "Leads" na área de gestão

**Files:**
- Create: `src/app/leads/LeadsPage.tsx`
- Create: `src/app/leads/LeadsPage.test.tsx`
- Modify: `src/App.tsx` (rota `/app/leads`)
- Modify: `src/app/Dashboard.tsx` (item de navegação)

**Interfaces:**
- Consumes: `listarLeads`, `atualizarStatusLead`, types `Lead`/`StatusLead` (Task 3); `RequireModulo` com `modulo="leads"`.
- Produces: `LeadsPage` (default export) — lista de leads (colunas Data · Nome · Documento · Capacidade · Bacia · Cidade · Status · ação), seletor de status por linha (chama `atualizarStatusLead` e recarrega), e botão **"Chamar no WhatsApp"** que abre `linkWhatsappLead(lead)`.
- Produces: `linkWhatsappLead(lead: Lead): string` (export em `LeadsPage.tsx` ou em `leads.api.ts`) → `https://wa.me/55<somente-dígitos-do-whatsapp>?text=<mensagem url-encoded>` onde a mensagem é `Olá ${lead.nome}, aqui é da Caldemat sobre seu orçamento de tanque de abastecimento.`

- [ ] **Step 1: Escrever os testes que falham** em `LeadsPage.test.tsx` (mockar `./leads.api`):
  - Renderiza as linhas de `listarLeads` (um lead "João", cidade "Sorriso-MT") — aparece "João" e "Sorriso-MT".
  - Trocar o status para "Contatado" chama `atualizarStatusLead(id, 'contatado')`.
  - `linkWhatsappLead` com `whatsapp: '(65) 99999-0000'` e `nome: 'João'` → começa com `https://wa.me/5565999990000?text=` e contém `Jo%C3%A3o` (nome url-encoded).
- [ ] **Step 2: Rodar e ver falhar.** Run: `npx vitest run src/app/leads/LeadsPage.test.tsx`. Esperado: FAIL.
- [ ] **Step 3: Implementar:**
  - `LeadsPage.tsx` no padrão de `ClientesPage` (carregar/`useEffect`, tabela, tratamento de erro). Status via `<select>` com as 4 opções. `linkWhatsappLead`: `const num = ('55' + lead.whatsapp.replace(/\D/g,''))`; abrir via `<a href={...} target="_blank" rel="noreferrer">`.
  - `App.tsx`: `{ path: 'leads', element: <RequireModulo modulo="leads"><Leads /></RequireModulo> }` dentro dos `children` de `/app` (importar `Leads from './app/leads/LeadsPage'`).
  - `Dashboard.tsx`: adicionar `{ modulo: 'leads', rotulo: 'Leads', to: '/app/leads' }` ao array `OPERACAO`.
- [ ] **Step 4: Rodar e ver passar.** Run: `npx vitest run src/app/leads/LeadsPage.test.tsx`. Esperado: PASS.
- [ ] **Step 5: Verificar o conjunto.** Run: `npm test` (toda a suíte vitest) + `npm run build` (typecheck). Esperado: PASS.
- [ ] **Step 6: Commit.**
```bash
git add src/app/leads/LeadsPage.tsx src/app/leads/LeadsPage.test.tsx src/App.tsx src/app/Dashboard.tsx
git commit -m "feat(leads): aba Leads na gestão com status e chamada no WhatsApp"
```

---

### Task 6: Playbook da campanha Google Ads (deliverable de conteúdo)

**Files:**
- Create: `docs/superpowers/playbooks/2026-10-26-google-ads-abastecimento-agricola.md`

Sem ciclo de teste (deliverable de conteúdo). Gate do revisor: a campanha está pronta pra colar no painel e protege o orçamento enxuto.

- [ ] **Step 1: Escrever o playbook** cobrindo, em passo a passo para quem nunca usou o painel:
  - Pré-requisitos (Seção 9 do spec): criar conta (propriedade do cliente + MCC do gestor + fatura do cliente), criar a ação de conversão "Lead – formulário orçamento" e anotar **ID/label** (vai em `VITE_GADS_ID`/`VITE_GADS_LABEL_LEAD`), vincular ao Perfil da Empresa, foto do tanque.
  - Estrutura: 1 campanha Search, 1 grupo de anúncios "Abastecimento agrícola", lance inicial Maximizar cliques com teto de CPC.
  - Orçamento: R$ 16/dia. Geo: MT (ajuste de raio VG/Cuiabá), segmentação por "presença".
  - **Palavras-chave** (frase/exata) — lista inicial para checar volume no planejador: "tanque de abastecimento agrícola", "comboio de abastecimento", "comboio de abastecimento agrícola", "tanque para diesel fazenda", "tanque aéreo para combustível", "tanque de combustível para lavoura", "tanque para abastecer trator", "tanque para abastecer avião agrícola".
  - **Negativadas**: plástico, polietileno, usado, "segunda mão", aluguel, locação, vaga, emprego, curso, sucata, manual, pdf.
  - **RSA**: 12–15 títulos e 4 descrições (sob medida, 40 anos, fabricação própria em MT, para combustível, orçamento rápido, entrega em MT).
  - **Extensões**: sitelinks, callouts, snippets, chamada (65) 99359-7968, local.
  - **URL final**: `caldemat.vercel.app/orcamento?utm_source=google&utm_medium=cpc&utm_campaign=abastecimento`.
  - **Rotina semanal**: revisar termos de pesquisa, adicionar negativadas, cortar o que só gasta, subir orçamento só após lead a custo aceitável.
- [ ] **Step 2: Commit.**
```bash
git add docs/superpowers/playbooks/2026-10-26-google-ads-abastecimento-agricola.md
git commit -m "docs(leads): playbook da campanha Google Ads de abastecimento agrícola"
```

---

## Notas de execução
- Tasks 1 precisa do Supabase CLI local (`supabase start`) para `supabase test db`.
- A LP só dispara conversão de verdade quando `VITE_GADS_ID` e `VITE_GADS_LABEL_LEAD` existirem no build (vêm da Task 6, depois da conta criada). Sem eles, a LP funciona e grava o lead normalmente; o disparo é no-op.
- A Edge Function `admin-users` precisa ser **reimplantada** após a Task 2 para o `pode_leads` valer na criação/edição de funcionários.
