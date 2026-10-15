# Fluxo de Caixa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A personal, private, mobile-and-desktop web app that shows a monthly cash flow at a glance (six numbers), lets the owner register incomes/expenses/fixed bills, and tracks full and partial payments — data synced across devices via Supabase.

**Architecture:** A standalone React SPA living in `fluxo de caixa/`, separate from the other projects in the workspace. Pure, deterministic money logic (the six numbers, recurring generation, currency) is isolated in `src/core/` and unit-tested with Vitest. Supabase (Postgres + Auth) holds the data behind row-level security so only the signed-in owner sees their rows; a thin typed data layer in `src/data/` maps between DB snake_case and TS camelCase. React screens in `src/ui/` consume the core logic and the data layer.

**Tech Stack:** React 18.3.1, Vite 5.4.11, TypeScript 5.6.3, Tailwind CSS 3.4.17, Vitest, `@supabase/supabase-js` v2.

**Spec:** `fluxo de caixa/docs/2026-10-15-fluxo-de-caixa-design.md`

## Global Constraints

- All money is handled as **integer cents** (`number`) in TS and `integer` columns in Postgres — never floating-point reais. Formatting to `R$ x.xxx,xx` happens only at display.
- Currency display: `R$` with `.` thousands separator and `,` decimals. Dates display as `dd/mm/aaaa`; stored/transported as ISO `YYYY-MM-DD` strings.
- Single user per account. Every Supabase row carries `user_id` and is protected by RLS keyed on `auth.uid()`.
- Monthly control: all six numbers are scoped to the selected month; nothing accumulates across months; no opening balance.
- Entry kinds are exactly `'in'` (entrada) and `'out'` (saída).
- Keep the app isolated in `fluxo de caixa/` with its own `package.json` and `node_modules`; do not touch the workspace-root project.
- Pin dependency versions to the exact versions above (match the existing root project).

## Review Focus

- **Partial payment math:** an entry with `paidCents` between 0 and `amountCents` must count its paid part in gastei/ganhei and its remainder (`amountCents − paidCents`) in tenho-pra-sair/entrar. Covered by Task 3 tests.
- **Month boundary:** an unpaid entry counts in its **due month**; a paid entry counts in its **payment month**. A bill due Oct must not appear in Nov's numbers. Covered by Task 3 tests.
- **Fixed-bill day overflow:** a fixed bill with `dueDay` 31 generated into a 30-day (or February) month must clamp to the last valid day, not roll into the next month. Covered by Task 4 tests.
- **Recurring idempotency:** opening the app twice in the same month must not generate a fixed bill's occurrence twice. Covered by Task 4 tests.
- **Currency parsing of messy input:** empty, `"0"`, `"1.234,56"`, and non-numeric form input must parse to correct cents or be rejected, never produce `NaN` cents. Covered by Task 2 tests.
- **Data isolation (RLS):** a query must only ever return the signed-in user's rows. Verified by the RLS policy in Task 5.

---

### Task 1: Scaffold the app + tooling

**Files:**
- Create: `fluxo de caixa/package.json`, `fluxo de caixa/vite.config.ts`, `fluxo de caixa/tsconfig.json`, `fluxo de caixa/tailwind.config.js`, `fluxo de caixa/postcss.config.js`, `fluxo de caixa/index.html`, `fluxo de caixa/.gitignore`, `fluxo de caixa/.env.local`, `fluxo de caixa/.env.example`
- Create: `fluxo de caixa/src/main.tsx`, `fluxo de caixa/src/App.tsx`, `fluxo de caixa/src/index.css`
- Create: `fluxo de caixa/src/core/money.test.ts` (trivial smoke test to prove Vitest runs)

**Interfaces:**
- Produces: a running Vite dev server, a passing `npm test`, and a passing `npm run build`.

- [ ] **Step 1: Create `package.json`** with scripts `dev` (vite), `build` (`tsc -b && vite build`), `preview`, `test` (`vitest run`), `test:watch` (`vitest`). Dependencies: `react@18.3.1`, `react-dom@18.3.1`, `@supabase/supabase-js@2.45.4`. devDependencies mirror the root project (`@vitejs/plugin-react@4.3.4`, `typescript@5.6.3`, `vite@5.4.11`, `tailwindcss@3.4.17`, `autoprefixer@10.4.20`, `postcss@8.4.49`, `@types/react@18.3.12`, `@types/react-dom@18.3.1`) plus `vitest@2.1.8` and `jsdom@25.0.1`.
- [ ] **Step 2: Create config files.** `vite.config.ts` with the react plugin, `server: { host: true }`, `base: './'` (so it works as a static deploy), and a `test: { environment: 'node' }` Vitest block. `tsconfig.json` copied from the root project. `tailwind.config.js` with `content: ["./index.html", "./src/**/*.{ts,tsx}"]` and a dark finance palette in `theme.extend.colors` (bg `#0f1115`, card `#171a21`, line `#262b36`, txt `#e8eaed`, muted `#8b93a1`, green `#3ddc84`, red `#ff6b6b`, blue `#5b9dff`, amber `#ffc15e`). `postcss.config.js` with tailwind + autoprefixer. `index.css` with the three `@tailwind` directives and `body { background: #0f1115 }`.
- [ ] **Step 3: Create `.env.example`** with `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=`, and `.env.local` with the owner's real values (URL `https://pgqjppmkxyuerfimwsny.supabase.co` and the anon public key already provided). Add `.env.local` and `node_modules` and `dist` to `.gitignore`.
- [ ] **Step 4: Create minimal `main.tsx`/`App.tsx`** rendering a "Fluxo de Caixa" placeholder, and a trivial `money.test.ts` asserting `expect(1).toBe(1)`.
- [ ] **Step 5: Install and verify.** Run `cd "fluxo de caixa" && npm install`.
- [ ] **Step 6: Run the test.** Run `npm test`. Expected: 1 passing test.
- [ ] **Step 7: Verify build.** Run `npm run build`. Expected: build succeeds, `dist/` produced.
- [ ] **Step 8: Commit.** `git add` the new app files; `git commit -m "feat(fluxo): scaffold app with vite, react, tailwind, vitest"`.

---

### Task 2: Money helpers (cents ↔ BRL)

**Files:**
- Create: `fluxo de caixa/src/core/money.ts`
- Test: `fluxo de caixa/src/core/money.test.ts` (replace the smoke test)

**Interfaces:**
- Produces: `formatBRL(cents: number): string`; `parseBRL(input: string): number | null` (returns cents, or `null` for invalid/empty input).

- [ ] **Step 1: Write failing tests** in `money.test.ts`:
  - `formatBRL(324000)` → `"R$ 3.240,00"`; `formatBRL(0)` → `"R$ 0,00"`; `formatBRL(5)` → `"R$ 0,05"`.
  - `parseBRL("1.234,56")` → `123456`; `parseBRL("3240")` → `324000`; `parseBRL("3240,5")` → `324050`; `parseBRL("")` → `null`; `parseBRL("abc")` → `null`; `parseBRL("0")` → `0`.
- [ ] **Step 2: Run** `npm test money` → FAIL (functions not defined).
- [ ] **Step 3: Implement** both functions in `money.ts`. `parseBRL` strips `R$`/spaces/thousands dots, treats a bare integer as whole reais, rejects anything leaving a non-numeric remainder.
- [ ] **Step 4: Run** `npm test money` → PASS.
- [ ] **Step 5: Commit** `test+feat(fluxo): BRL cents formatting and parsing`.

---

### Task 3: Monthly summary — the six numbers

**Files:**
- Create: `fluxo de caixa/src/core/types.ts`, `fluxo de caixa/src/core/summary.ts`
- Test: `fluxo de caixa/src/core/summary.test.ts`

**Interfaces:**
- Produces in `types.ts`:
  ```ts
  export type Kind = 'in' | 'out';
  export interface Entry {
    id: string; kind: Kind; name: string; description: string;
    amountCents: number; paidCents: number;        // paidCents: realized portion, 0..amountCents
    purchaseDate: string; dueDate: string;          // 'YYYY-MM-DD'
    paidDate: string | null;                        // set when paidCents > 0
    sourceFixedId: string | null;
  }
  export type NewEntry = Omit<Entry, 'id'>;
  ```
- Produces in `summary.ts`:
  ```ts
  export interface MonthSummary {
    have: number; earned: number; spent: number;
    toReceive: number; toPay: number; projected: number;
  }
  export function monthSummary(entries: Entry[], month: string): MonthSummary; // month = 'YYYY-MM'
  ```
- Rules: `earned` = Σ `paidCents` for `in` with `paidDate` in `month`; `spent` = Σ `paidCents` for `out` with `paidDate` in `month`; `toReceive` = Σ `(amountCents − paidCents)` for `in` with `dueDate` in `month`; `toPay` = Σ `(amountCents − paidCents)` for `out` with `dueDate` in `month`; `have = earned − spent`; `projected = have + toReceive − toPay`.

- [ ] **Step 1: Write failing tests** in `summary.test.ts` covering, for `month = '2026-10'`:
  - An unpaid `out` due 2026-10-10 adds its full amount to `toPay`, nothing to `spent`.
  - A fully paid `in` with `paidDate` 2026-10-05 adds to `earned` and to `have`.
  - A partially paid `out` (`amountCents` 89000, `paidCents` 50000, `paidDate` in month, `dueDate` in month) adds 50000 to `spent` and 39000 to `toPay`.
  - An entry due 2026-11-10 contributes nothing to October's `toPay`/`toReceive` (month boundary).
  - A paid `out` whose `paidDate` is 2026-11-02 contributes nothing to October's `spent` even if `dueDate` was October.
  - `projected` equals `have + toReceive − toPay` on a mixed fixture.
  - Empty list → all six are 0.
- [ ] **Step 2: Run** `npm test summary` → FAIL.
- [ ] **Step 3: Implement** `monthSummary`. Compare months by the `YYYY-MM` prefix of the relevant date string.
- [ ] **Step 4: Run** `npm test summary` → PASS.
- [ ] **Step 5: Commit** `test+feat(fluxo): monthly six-number summary`.

---

### Task 4: Recurring (contas fixas) generation

**Files:**
- Create: `fluxo de caixa/src/core/recurring.ts`
- Test: `fluxo de caixa/src/core/recurring.test.ts`

**Interfaces:**
- Produces in `types.ts` (add): `export interface FixedBill { id: string; kind: Kind; name: string; description: string; amountCents: number; dueDay: number; }`
- Produces in `recurring.ts`: `export function occurrencesToGenerate(fixedBills: FixedBill[], existing: Entry[], month: string): NewEntry[];`
- Rules: for each fixed bill, if **no** `existing` entry has `sourceFixedId === bill.id` with `dueDate` in `month`, emit one `NewEntry` with `kind`, `name`, `description`, `amountCents` from the bill; `paidCents` 0; `paidDate` null; `sourceFixedId` = bill.id; `dueDate` = `month` + day clamped to the month's last day; `purchaseDate` = same as `dueDate`.

- [ ] **Step 1: Write failing tests** in `recurring.test.ts`:
  - A bill with `dueDay` 10 and no existing occurrence in `2026-10` yields one `NewEntry` with `dueDate` `2026-10-10` and `sourceFixedId` set.
  - Running again with that generated entry present yields `[]` (idempotency).
  - A bill with `dueDay` 31 in `2026-11` (30 days) yields `dueDate` `2026-11-30` (clamp); in `2026-02` yields `2026-02-28`.
  - Two bills, one already generated and one not → only the missing one is emitted.
- [ ] **Step 2: Run** `npm test recurring` → FAIL.
- [ ] **Step 3: Implement** `occurrencesToGenerate` using the clamp `Math.min(dueDay, lastDayOf(month))`.
- [ ] **Step 4: Run** `npm test recurring` → PASS.
- [ ] **Step 5: Commit** `test+feat(fluxo): fixed-bill monthly occurrence generation`.

---

### Task 5: Supabase schema, RLS, and data layer

**Files:**
- Create: `fluxo de caixa/supabase/schema.sql` (run by the owner in the Supabase SQL editor)
- Create: `fluxo de caixa/src/data/supabase.ts`, `fluxo de caixa/src/data/mappers.ts`, `fluxo de caixa/src/data/entries.ts`, `fluxo de caixa/src/data/fixedBills.ts`

**Interfaces:**
- `schema.sql` creates tables `entries` and `fixed_bills`, both with `id uuid default gen_random_uuid() primary key`, `user_id uuid not null default auth.uid() references auth.users`, the domain columns (`kind text check (kind in ('in','out'))`, `name text`, `description text`, `amount_cents integer`, and for entries `paid_cents integer default 0`, `purchase_date date`, `due_date date`, `paid_date date`, `source_fixed_id uuid`; for fixed_bills `due_day integer check (due_day between 1 and 31)`), `created_at timestamptz default now()`. Enables RLS on both and adds a policy per table: `using (auth.uid() = user_id) with check (auth.uid() = user_id)` for all actions.
- `supabase.ts` produces: `export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`.
- `mappers.ts` produces `rowToEntry`, `entryToRow`, `rowToFixedBill`, `fixedBillToRow` (snake_case ↔ camelCase; `user_id` is set by the DB default, not sent from the client).
- `entries.ts` produces: `listEntries(): Promise<Entry[]>`, `createEntry(input: NewEntry): Promise<Entry>`, `updateEntry(id: string, patch: Partial<NewEntry>): Promise<Entry>`, `deleteEntry(id: string): Promise<void>`, `markPaid(id: string, paidCents: number, paidDate: string): Promise<Entry>`.
- `fixedBills.ts` produces: `listFixedBills(): Promise<FixedBill[]>`, `createFixedBill(input: Omit<FixedBill,'id'>): Promise<FixedBill>`, `updateFixedBill(id, patch): Promise<FixedBill>`, `deleteFixedBill(id): Promise<void>`.

- [ ] **Step 1: Write `schema.sql`** with the two tables, RLS enabled, and the owner-only policies described above.
- [ ] **Step 2: Owner runs the SQL.** Paste `schema.sql` into Supabase → SQL Editor → Run. (Builder: pause and hand this to the owner; confirm both tables exist with RLS on before continuing.)
- [ ] **Step 3: Implement** `supabase.ts`, `mappers.ts`, `entries.ts`, `fixedBills.ts` with the signatures above. `markPaid` sets `paid_cents` and `paid_date` in one update.
- [ ] **Step 4: Verify types compile.** Run `npm run build`. Expected: PASS (no network call needed to typecheck).
- [ ] **Step 5: Commit** `feat(fluxo): supabase schema, RLS, and typed data layer`.

---

### Task 6: Authentication gate

**Files:**
- Create: `fluxo de caixa/src/data/auth.ts`, `fluxo de caixa/src/ui/AuthGate.tsx`, `fluxo de caixa/src/ui/LoginScreen.tsx`

**Interfaces:**
- Consumes: `supabase` from Task 5.
- Produces in `auth.ts`: `signIn(email, password)`, `signUp(email, password)`, `signOut()`, `getSession()`, `onAuthChange(cb: (signedIn: boolean) => void)`.
- Produces: `<AuthGate>` renders children only when a session exists, otherwise `<LoginScreen>`. `<LoginScreen>` is an email+password form with a toggle between "Entrar" and "Criar conta", showing Supabase error text in Portuguese-friendly copy.

- [ ] **Step 1: Implement** `auth.ts` wrapping `supabase.auth.signInWithPassword`, `signUp`, `signOut`, `getSession`, `onAuthStateChange`.
- [ ] **Step 2: Implement** `LoginScreen.tsx` (controlled email/password inputs, submit, error line) and `AuthGate.tsx` (subscribes to `onAuthChange`, renders children or login).
- [ ] **Step 3: Wire** `AuthGate` around the app in `App.tsx`.
- [ ] **Step 4: Verify** `npm run build` passes, then `npm run dev` and confirm in the browser: creating an account and signing in reveals the app; signing out returns to login. (Manual check — record the result.)
- [ ] **Step 5: Commit** `feat(fluxo): email/password auth gate`.

---

### Task 7: App shell — tabs, month selector, state

**Files:**
- Create: `fluxo de caixa/src/ui/Shell.tsx`, `fluxo de caixa/src/ui/TopBar.tsx`, `fluxo de caixa/src/ui/MonthContext.tsx`, `fluxo de caixa/src/ui/useData.ts`
- Modify: `fluxo de caixa/src/App.tsx`

**Interfaces:**
- Consumes: data layer (Task 5), `AuthGate` (Task 6).
- Produces: `<Shell>` holds the active tab (`'caixa' | 'in' | 'out' | 'fixed'`) and the selected month (`YYYY-MM`, default current). `<TopBar>` renders the four tabs (Caixa, Entradas, Saídas, Contas fixas) plus sign-out. `MonthContext` exposes `{ month, setMonth }`. `useData()` loads entries + fixed bills into state and exposes `reload()`, consumed by the screens.

- [ ] **Step 1: Implement** `MonthContext`, `useData` (fetch on mount via `listEntries`/`listFixedBills`, expose `{ entries, fixedBills, reload, loading }`), `TopBar`, and `Shell` (tab + month state, renders the active screen — placeholders until Tasks 8–10).
- [ ] **Step 2: Wire** `App.tsx` = `<AuthGate><Shell/></AuthGate>`.
- [ ] **Step 3: Verify** `npm run build` passes; `npm run dev` shows four switchable tabs and a working month selector. (Manual check.)
- [ ] **Step 4: Commit** `feat(fluxo): app shell with tabs and month selector`.

---

### Task 8: Cadastro form (Entradas, Saídas, Contas fixas)

**Files:**
- Create: `fluxo de caixa/src/ui/EntryForm.tsx`, `fluxo de caixa/src/ui/FixedBillForm.tsx`, `fluxo de caixa/src/ui/RegisterScreen.tsx`
- Create: `fluxo de caixa/src/ui/EntryForm.test.tsx`

**Interfaces:**
- Consumes: `createEntry`/`createFixedBill` (Task 5), `parseBRL` (Task 2), `useData().reload`.
- Produces: `<EntryForm kind="in"|"out" onSaved />` with fields Nome, Descrição, Valor (parsed via `parseBRL`), Data da compra, Vencimento; disables submit and shows a message when `parseBRL` returns `null`. `<FixedBillForm kind="out" onSaved />` with Nome, Descrição, Valor, Dia do vencimento (1–31). `<RegisterScreen tab>` picks the right form and shows the existing items list for that tab.

- [ ] **Step 1: Write a failing component test** (`EntryForm.test.tsx`, jsdom): typing an invalid Valor (`"abc"`) keeps the submit disabled / shows the invalid message; a valid entry calls the injected `onSubmit` with `amountCents` 324000 for input `"3.240,00"`.
- [ ] **Step 2: Run** `npm test EntryForm` → FAIL.
- [ ] **Step 3: Implement** the forms and `RegisterScreen`. New entries default `paidCents` 0 / `paidDate` null. On save, call the API then `reload()`.
- [ ] **Step 4: Run** `npm test EntryForm` → PASS; then `npm run build`.
- [ ] **Step 5: Verify** in `npm run dev`: registering an entrada, a saída, and a conta fixa persists and shows in the lists after reload. (Manual check.)
- [ ] **Step 6: Commit** `feat(fluxo): cadastro forms for entries and fixed bills`.

---

### Task 9: Caixa screen — six numbers + list + auto-generate fixed bills

**Files:**
- Create: `fluxo de caixa/src/ui/Caixa.tsx`, `fluxo de caixa/src/ui/StatCards.tsx`, `fluxo de caixa/src/ui/EntryList.tsx`
- Modify: `fluxo de caixa/src/ui/Shell.tsx` (render `<Caixa>` on the caixa tab)

**Interfaces:**
- Consumes: `monthSummary` (Task 3), `occurrencesToGenerate` + `createEntry` (Tasks 4–5), `formatBRL` (Task 2), `useData`, `MonthContext`.
- Produces: `<Caixa>` that, on mount and whenever `month` changes, calls `occurrencesToGenerate(fixedBills, entries, month)` and persists any results via `createEntry` then `reload` (so contas fixas appear automatically); renders `<StatCards summary>` (hero "Quanto tenho agora" + the other five, matching the validated mockup) and `<EntryList entries>` filtered to the month with the vencimento / "repete todo mês" / "pago em parte · falta R$ X" tags.

- [ ] **Step 1: Implement** `StatCards` and `EntryList` as presentational components driven by `monthSummary` output and the month's entries, styled to the approved dark mockup.
- [ ] **Step 2: Implement** `Caixa`: run the generation effect (guard against double-run within a render cycle), compute `monthSummary`, render the cards and list.
- [ ] **Step 3: Verify** `npm run build`; then `npm run dev`: the six numbers match a hand-checked fixture, and a conta fixa cadastrada appears automatically in the current month. (Manual check.)
- [ ] **Step 4: Commit** `feat(fluxo): caixa dashboard with six numbers and auto fixed-bill generation`.

---

### Task 10: Mark paid / received (full and partial)

**Files:**
- Create: `fluxo de caixa/src/ui/PayModal.tsx`
- Modify: `fluxo de caixa/src/ui/EntryList.tsx` (add a "marcar pago/recebido" action per item)

**Interfaces:**
- Consumes: `markPaid` (Task 5), `parseBRL`/`formatBRL`, `useData().reload`, `monthSummary` (to re-render).
- Produces: `<PayModal entry onDone />` offering "Pagar tudo" (sets `paidCents = amountCents`, `paidDate` = today) or a partial amount (parsed via `parseBRL`, clamped to the remaining `amountCents − paidCents`), persisted via `markPaid`; after save, `reload()` so the six numbers move.

- [ ] **Step 1: Write a failing test** (`PayModal.test.tsx`): choosing "Pagar tudo" calls the injected `onPay` with `paidCents === amountCents`; a partial of `"R$ 50,00"` on an 89000-cent bill calls `onPay` with `paidCents` 50000; a partial above the remaining amount is clamped to the remaining amount.
- [ ] **Step 2: Run** `npm test PayModal` → FAIL.
- [ ] **Step 3: Implement** `PayModal` and the list action.
- [ ] **Step 4: Run** `npm test PayModal` → PASS; then `npm run build`.
- [ ] **Step 5: Verify** in `npm run dev`: marking a saída as fully paid moves it from "tenho pra sair" to "gastei"; a partial payment splits correctly and shows "falta R$ X". (Manual check.)
- [ ] **Step 6: Commit** `feat(fluxo): full and partial payment flow`.

---

## Notes for the executor

- Tasks 2, 3, 4, 8, 10 are TDD (real failing test first). Tasks 1, 5, 6, 7, 9 are verified by `npm run build` plus a recorded manual browser check, because their core is scaffolding, network I/O, or visual layout that unit tests would not meaningfully pin.
- Task 5 Step 2 requires the owner to run SQL in Supabase — pause there and confirm before proceeding.
- Deployment (static build to GitHub Pages or similar, like the Probold site) is out of scope for these tasks and handled once the app works locally; revisit with the owner.
