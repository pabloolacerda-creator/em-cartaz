# Módulo Financeiro — Plano de Implementação

> Execução nativa (inline), TDD, suíte verde a cada passo.

**Goal:** Controle financeiro simples (contas, lançamentos a pagar/receber, fluxo, dashboard) amarrado aos pedidos.
**Spec:** `docs/superpowers/specs/2026-10-22-financeiro-design.md`
**Stack:** Vite+React+TS+Tailwind, Supabase (Postgres+RLS), Vitest+RTL. Gráficos à mão (SVG/CSS), sem nova dependência.

## Constraints
- `saldo` da conta = só lançamentos **pagos**; "previsto" é cálculo à parte.
- Permissão `pode_financeiro`; admin sempre acessa.
- Campos novos no payload só quando aplicáveis; manter suíte verde (hoje 160 testes).
- Carga tolerante a falha (migração pode não estar aplicada).

## Review Focus
- Lançamento sem conta/sem pago_em → não entra no saldo; não quebra agregação. (T4)
- Pedido já com conta a receber → não duplica; avisa. (T8)
- Mês sem lançamentos / listas vazias → dashboard mostra zeros, sem NaN. (T4)
- Datas de vencimento no passado (vencido) contam como inadimplência. (T4)

---

### T1 — Migração 0006 + tipos
- `supabase/migrations/0006_financeiro.sql`: tabelas `contas_financeiras`, `lancamentos`; `perfis.pode_financeiro`; recria `tem_permissao` (+'financeiro') e `perfis_bloqueia_escalada` (+pode_financeiro); view `saldo_contas`; RLS por `tem_permissao('financeiro')` (lancamentos também delete).
- `src/types.ts`: `ContaFinanceira`, `Lancamento`, `Perfil.pode_financeiro`, `Modulo` += 'financeiro'.

### T2 — Permissão pode_financeiro (wiring)
- `permissions.ts` (+case) e teste; `funcionarios.api` Permissoes += pode_financeiro; `FuncionariosPage` checkbox "Financeiro" (+teste/payload); `admin-users` PERMS += 'pode_financeiro'; `Dashboard` OPERACAO += Financeiro (/app/financeiro); `App.tsx` rotas.

### T3 — financeiro.api (TDD)
- `listarContas` (com saldo via view saldo_contas), `criarConta`, `editarConta`, `inativarConta`.
- `listarLancamentos`, `criarLancamento`, `editarLancamento`, `marcarPago(id, pago_em, conta_id)`, `excluirLancamento`.
- `ReceberInput`/`contaDoPedido(pedido_id)` (checa duplicado) + `gerarContaReceber(pedido)`.

### T4 — dashboard.ts (funções puras, TDD)
- `resumoFinanceiro(lancamentos, contas, hoje)` → { saldoTotal, totalAPagar, totalAReceber, receitasMes, despesasMes, resultadoMes, previsto7/15/30, inadimplencia, alertaNegativo }.
- `proximosVencimentos(lancamentos, hoje, dias)`, `serieMensal(lancamentos, n, hoje)`.

### T5 — ContasPage (TDD) — cadastro banco/caixa + saldo.
### T6 — LancamentosPage (TDD) — lista com filtro (todos / a pagar / a receber / vencidos), criar, **marcar pago**, excluir.
### T7 — FluxoPage (TDD) — por período: previsto × realizado, saldo.
### T8 — FinanceiroPainel (dashboard) + 2 gráficos (TDD nos números via dashboard.ts; componente renderiza cartões e alertas). Botão **Gerar conta a receber** no `PedidoDetalhe` (+teste).
### T9 — FinanceiroLayout (subnav Painel/Lançamentos/Contas/Fluxo) + rotas aninhadas.
### T10 — Verificação (vitest + build) + deploy + migração 0006 na entrega.
