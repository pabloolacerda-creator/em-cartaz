# Site + Sistema Xandão Vidros — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o site institucional + sistema de gestão da Xandão Vidros reaproveitando o projeto Caldemat — mesma stack e fluxo, reescopado para vidraçaria.

**Architecture:** Fork do projeto `Site caldemat` (mesmo repositório) para a pasta `Site Xandão Vidros`, estabelecendo uma baseline verde com a suíte de testes existente; depois aplicar deltas: remover o que é de metalúrgica (calculadora de chapa), rebrandar (dados, logo, paleta), reescrever o conteúdo do site para vidraçaria e ajustar rótulos do catálogo. O banco (Supabase/Postgres) do Caldemat já tem nomes genéricos (`perfis`, `clientes`, `produtos`, `pedidos`, `lancamentos`…) e vem **sem alterações de schema**.

**Tech Stack:** Vite 5 + React 18 + TypeScript 5 + Tailwind 3; Supabase (Postgres, Auth, RLS, Edge Function); Vitest + Testing Library; deploy Vercel. (Versões exatas herdadas do `package.json` do Caldemat — não atualizar.)

**Spec:** `docs/superpowers/specs/2026-11-09-sistema-xandao-vidros-design.md`

## Global Constraints

- Reaproveitar a base do Caldemat verbatim; divergir só onde o plano pede. Herdar as versões do `package.json` do Caldemat sem atualizar.
- Toda tela e texto em **pt-BR**.
- Manter a **suíte de testes existente verde** (`npm run test`) e o **build limpo** (`npm run build`) ao fim de cada task.
- Valores de marca exatos: nome **Xandão Vidros**; atendimento **Cuiabá e Várzea Grande/MT**; WhatsApp **(65) 98403-1635** → URL `https://wa.me/5565984031635`; Instagram **@xandaovidros1**.
- Catálogo **sem preços** no seed (o cliente preenche). **Um único usuário admin** (o Xandão) — sem cadastro de funcionários no dia a dia.
- Segredos (service role) nunca no front nem no Vercel.
- Logo oficial em `IMG/logo/` (wordmark grafite + monograma). Paleta: grafite base + azul/teal de vidro como acento.

## Review Focus

- **Orçamento de vidro com medidas decimais** (ex.: 0,80 × 1,90 m): o m² e o valor do item devem bater — pinned no Task 2 (teste de `calcularValorItem` com vidro).
- **Catálogo/pedido sem preço** (valor_venda ausente/0): criar item e imprimir não pode quebrar; total = 0 — pinned no Task 6.
- **Link do WhatsApp** no formato `https://wa.me/5565984031635` (só dígitos, com 55): pinned no Task 4 (teste da constante `WHATSAPP_URL`).
- **Impressão do documento do cliente** (`PedidoDetalhe`) com o novo timbrado em A4: validação visual — pinned no Task 3 (checagem manual de impressão, sem unit test possível).
- **Login do único admin vê todos os módulos**: a navegação não pode esconder módulos do admin — coberto pelos testes de auth/permissões herdados; reconfirmar no Task 7.

---

## Task 1: Fork — baseline verde

**Files:**
- Create (copiar de `Site caldemat/`): `src/**`, `supabase/**`, `index.html`, `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `vercel.json`, `.env.example`, `.gitignore`, `README.md`, `public/**`.
- Excluir da cópia: `node_modules/`, `dist/`, `.env.local`, qualquer `.git/`.
- Test: a suíte copiada (`src/**/*.test.ts(x)`, `supabase/tests/**`).

**Interfaces:**
- Consumes: nada (ponto de partida).
- Produces: projeto `Site Xandão Vidros` compilável, com os módulos do Caldemat intactos e testes verdes. Todos os paths citados nas tasks seguintes passam a existir sob `Site Xandão Vidros/`.

- [ ] **Step 1:** Copiar os arquivos/pastas acima de `Site caldemat/` para `Site Xandão Vidros/` (sem `node_modules`, `dist`, `.env.local`, `.git`).
- [ ] **Step 2:** Ajustar `package.json` → `"name": "xandao-vidros"`.
- [ ] **Step 3:** `npm install` dentro de `Site Xandão Vidros`.
- [ ] **Step 4:** Rodar `npm run test` — Expected: PASS (toda a suíte herdada verde).
- [ ] **Step 5:** Rodar `npm run build` — Expected: build sem erros de tipo.
- [ ] **Step 6: Commit** — `chore: fork do projeto Caldemat como base da Xandão Vidros`.

---

## Task 2: Remover a calculadora de chapa de aço

A calculadora de chapa (`src/lib/chapa.ts` + `src/app/calculadora/CalculadoraPage.tsx`) é específica de metalúrgica (peso de aço). O cálculo de m² usado no orçamento vive em `src/app/pedidos/calculo.ts` e **permanece**.

**Files:**
- Delete: `src/lib/chapa.ts`, `src/lib/chapa.test.ts`, `src/app/calculadora/CalculadoraPage.tsx`, `src/app/calculadora/CalculadoraPage.test.tsx`.
- Modify: `src/App.tsx` (remover `import Calculadora` e a rota `calculadora`), `src/app/Dashboard.tsx:21` (remover o item `{ modulo: 'pedidos', rotulo: 'Calculadora', ... }` de `OPERACAO`).
- Test: `src/app/pedidos/calculo.test.ts` (adicionar caso de vidro).

**Interfaces:**
- Consumes: `calcularValorItem(unidade, quantidade, largura, altura, valorUnitario)` de Task 1 (`calculo.ts`), inalterado.
- Produces: rota `/app/calculadora` e seu link some; `calculo.ts` segue exportando `calcularValorItem` e `modoMedida`.

- [ ] **Step 1: Escrever o teste de vidro (Review Focus)** em `calculo.test.ts`:

```ts
test('vidro por m²: 0,80 × 1,90 m × 2 un a R$ 120/m² = R$ 364,80', () => {
  expect(calcularValorItem('m²', 2, 0.8, 1.9, 120)).toBe(364.8)
})
```

- [ ] **Step 2:** Rodar esse teste — Expected: PASS (comportamento já existe; o teste fixa o contrato).
- [ ] **Step 3:** Deletar os 4 arquivos de chapa/calculadora listados.
- [ ] **Step 4:** Remover em `src/App.tsx` o import `Calculadora` e a rota `{ path: 'calculadora', ... }`; remover em `src/app/Dashboard.tsx` o item "Calculadora" de `OPERACAO`.
- [ ] **Step 5:** Rodar `npm run test` e `npm run build` — Expected: PASS, sem referências pendentes a `chapa`/`Calculadora`.
- [ ] **Step 6: Commit** — `refactor: remove calculadora de chapa (específica de metalúrgica)`.

---

## Task 3: Identidade de marca (dados + logo + timbrado)

**Files:**
- Modify: `src/lib/empresa.ts` (dados institucionais da impressão), `index.html` (`<title>`).
- Assets em `public/`: substituir `logo-cor.png` (sidebar do painel) e `timbrado.png` (cabeçalho de impressão) pelas versões da Xandão, geradas a partir de `IMG/logo/`.
- Test: qualquer teste que afirme o nome "Caldemat" no painel (ex.: `src/app/Dashboard.test.tsx`) → atualizar para "Xandão Vidros".

**Interfaces:**
- Consumes: `EMPRESA` é lido por `PedidoDetalhe.tsx` e `PedidoOS.tsx` (via `EMPRESA.nome`), e `/timbrado.png`/`/logo-cor.png` por essas telas e pelo `Dashboard`.
- Produces: `EMPRESA` com os dados da Xandão; assets de marca em `public/`.

- [ ] **Step 1:** Atualizar o teste do painel (`Dashboard.test.tsx`) para esperar `alt`/nome **"Xandão Vidros"** no lugar de "Caldemat".
- [ ] **Step 2:** Rodar — Expected: FAIL (código ainda diz Caldemat).
- [ ] **Step 3:** Reescrever `src/lib/empresa.ts` com: `nome: 'Xandão Vidros'`, `slogan: 'Segurança, elegância e resistência.'`, `endereco: 'Cuiabá e Várzea Grande/MT'`, `telefone: '(65) 98403-1635'`, `email`/`cnpj` conforme fornecido (placeholder se faltar), `logo: '/timbrado.png'`. Atualizar `index.html` `<title>` para "Xandão Vidros".
- [ ] **Step 4:** Gerar/salvar `public/logo-cor.png` (versão horizontal da logo) e `public/timbrado.png` (versão empilhada, faixa p/ impressão) a partir de `IMG/logo/`.
- [ ] **Step 5:** Rodar `npm run test` e `npm run build` — Expected: PASS.
- [ ] **Step 6: Review Focus — checagem de impressão:** abrir um pedido, imprimir (Ctrl+P / salvar PDF) e confirmar que o timbrado da Xandão aparece inteiro no topo em A4, sem cortar. (Validação visual; registrar no commit.)
- [ ] **Step 7: Commit** — `feat: identidade de marca Xandão Vidros (dados, logo, timbrado)`.

---

## Task 4: Paleta (grafite + teal de vidro)

**Files:**
- Modify: `tailwind.config.js` (token `brand`), e os usos de cor "esmeralda" hardcoded no site: `src/site/Home.tsx` (`emerald-400`, `hover:bg-emerald-700`), e qualquer outro `emerald-*` em `src/site/**`.
- Test: n/a (cor é visual); garantir build.

**Interfaces:**
- Consumes: classes `bg-brand`/`border-brand`/`text-brand` já usadas no site.
- Produces: `brand` = grafite da logo; acento teal/azul de vidro onde hoje há esmeralda.

- [ ] **Step 1:** Em `tailwind.config.js`, trocar `colors.brand` de `#1E6B4A` para o grafite da logo (≈ `#4B4F54`) e adicionar um acento, ex. `colors: { brand: '#4B4F54', vidro: '#2B8FA6' }`.
- [ ] **Step 2:** Substituir em `src/site/**` os `emerald-*` hardcoded por `brand`/`vidro` (ou `text-vidro`, `hover:bg-vidro`), mantendo o contraste do texto sobre foto.
- [ ] **Step 3:** Rodar `npm run build` — Expected: PASS. Conferir visualmente a Home (CTA, números) com a paleta nova.
- [ ] **Step 4: Commit** — `style: paleta grafite + teal de vidro`.

---

## Task 5: Conteúdo do site institucional (vidraçaria)

**Files:**
- Modify: `src/site/dados.ts` (contatos + NAV), `src/site/Home.tsx`, `src/site/Empresa.tsx`, `src/site/Produtos.tsx` (→ tipos de vidro/produtos), `src/site/Servicos.tsx` (lista de serviços residenciais e comerciais), `src/site/Contato.tsx`, `src/site/Footer.tsx`.
- Assets: fotos em `public/fotos/` — usar placeholders até o Pablo enviar (Pendência item 4 da spec).
- Test: `src/site/Site.test.tsx` e `src/site/Orcamento.test.tsx` — atualizar asserções que citam textos do Caldemat para os da Xandão.

**Interfaces:**
- Consumes: `WHATSAPP_URL`, `TELEFONE`, `EMAIL`, `ENDERECO`, `INSTAGRAM`, `NAV` de `dados.ts`.
- Produces: `WHATSAPP_URL = 'https://wa.me/5565984031635'`, `TELEFONE = '(65) 98403-1635'`, `INSTAGRAM = '@xandaovidros1'`, `ENDERECO = 'Cuiabá e Várzea Grande/MT'`; seções do site com copy de vidraçaria.

- [ ] **Step 1: Teste do WhatsApp (Review Focus)** — em `Site.test.tsx` (ou `dados.test.ts` novo):

```ts
test('WHATSAPP_URL usa o número da Xandão com DDI 55', () => {
  expect(WHATSAPP_URL).toBe('https://wa.me/5565984031635')
})
```

- [ ] **Step 2:** Atualizar `Site.test.tsx`/`Orcamento.test.tsx` para esperar textos da Xandão (ex.: nome "Xandão Vidros", um serviço como "box para banheiro"). Rodar — Expected: FAIL.
- [ ] **Step 3:** Reescrever `dados.ts` (contatos acima; `NAV` conforme seções mantidas) e o copy das seções do site:
  - **Home:** headline de vidraçaria + lema "Segurança, elegância e resistência"; CTA "Pedir orçamento no WhatsApp"; números/credenciais adequados (sem inventar métricas falsas).
  - **Empresa:** sobre a Xandão Vidros, atendimento em Cuiabá e Várzea Grande.
  - **Produtos/Serviços:** usar as duas listas da spec (Residencial e Comercial): portas/janelas temperadas, box, espelhos sob medida, sacadas/varandas, divisórias, guarda-corpo, coberturas, prateleiras, tampos, nichos; fachadas, vitrines, pele de vidro, portas automáticas, balcões, guichês, fechamento de lojas.
  - **Contato/Footer:** WhatsApp, Instagram @xandaovidros1, Cuiabá e Várzea Grande/MT.
- [ ] **Step 4:** Rodar `npm run test` e `npm run build` — Expected: PASS.
- [ ] **Step 5: Commit** — `feat: conteúdo do site institucional da Xandão Vidros`.

---

## Task 6: Catálogo — rótulos p/ vidros e ferragens, sem preço

O módulo de produtos (`src/app/produtos/*`) já guarda item com `unidade` + `valor_venda` e serve para vidros (m²) e ferragens (un). Ajuste é de **rótulo/descrição**, não de lógica; **sem seed de preços**.

**Files:**
- Modify: `src/app/CadastroHome.tsx` (cards "Matéria-Prima"/"Produtos") e `src/app/Dashboard.tsx` (itens de `CADASTRO_SUBS`), para texto de vidraçaria.
- Test: testes que afirmam os rótulos antigos (se houver) em `CadastroHome`/`Dashboard` tests.

**Interfaces:**
- Consumes: módulos `materia_prima` e `produtos` (permissões) inalterados.
- Produces: rótulos de catálogo coerentes com vidraçaria.

- [ ] **Step 1: Teste do item sem preço (Review Focus)** — em `calculo.test.ts`, fixar que item sem valor não quebra e soma 0:

```ts
test('item sem preço: valor do item = 0', () => {
  expect(calcularValorItem('m²', 2, 0.8, 1.9, NaN)).toBe(0)
})
```

- [ ] **Step 2:** Rodar — Expected: PASS (já tratado em `calculo.ts`; o teste fixa o contrato).
- [ ] **Step 3:** Ajustar os rótulos em `CadastroHome.tsx` e `Dashboard.tsx`: card de matéria-prima → **"Vidros e Ferragens"** com descrição "Cadastre tipos de vidro (por m²) e ferragens (por unidade)."; manter "Produtos/Serviços" para serviços avulsos. Atualizar testes de rótulo correspondentes primeiro (FAIL→PASS) se existirem.
- [ ] **Step 4:** Rodar `npm run test` e `npm run build` — Expected: PASS.
- [ ] **Step 5: Commit** — `feat: rótulos do catálogo para vidros e ferragens`.

---

## Task 7: Usuário único (admin) + deploy + relatório dos caminhos

**Files:**
- Modify: `supabase/seed_admin.sql` (comentário/instrução para `admin@xandaovidros.local`), `README.md` (setup Xandão), `.env.example` (inalterado).
- Create: `docs/relatorio-dos-caminhos.md` (guia do cliente, como no Caldemat).
- Test: reconfirmar `RequireModulo`/permissões (herdados).

**Interfaces:**
- Consumes: migrations e `seed_admin.sql` do Caldemat (schema genérico, sem mudança).
- Produces: projeto pronto p/ deploy (Supabase novo + Vercel novo), com admin único e guia do cliente.

- [ ] **Step 1: Review Focus — admin vê tudo:** rodar os testes de permissão herdados (`RequireModulo.test.tsx`, `permissions.test.ts`) — Expected: PASS (admin com `is_admin` acessa todos os módulos; nav não esconde nada do admin).
- [ ] **Step 2:** Ajustar `README.md` para a Xandão: passos de Supabase novo, Vercel (Root Directory `Site Xandão Vidros`), variáveis `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, e seed do admin `admin@xandaovidros.local`. Atualizar `seed_admin.sql` com o comentário do e-mail.
- [ ] **Step 3:** Escrever `docs/relatorio-dos-caminhos.md`: como logar, criar cliente, montar orçamento com m², gerar PDF e mandar no WhatsApp, aprovar/faturar, usar o financeiro (entrada/saída, a pagar/a receber), e como recuperar acesso de admin.
- [ ] **Step 4:** Rodar `npm run test` e `npm run build` — Expected: PASS.
- [ ] **Step 5: Commit** — `docs: setup de deploy, admin único e relatório dos caminhos`.

---

## Notas de execução

- **Fotos do site** (Pendência item 4 da spec): placeholders até o Pablo enviar; trocar os arquivos em `public/fotos/` depois, sem mexer no código.
- **Preços do catálogo**: entram pelo Xandão no uso; o seed vai vazio.
- **Deploy** (criar projeto Supabase, aplicar migrations, publicar Edge Function, Vercel, domínio) segue o `README.md` — é operação de infraestrutura, fora do ciclo de testes das tasks.
