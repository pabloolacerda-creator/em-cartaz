# Desenho — Módulo Financeiro (simples e funcional)

Data: 2026-10-22 · Projeto: Site Caldemat · Branch: `caldemat`

## Intenção e porquê

A Caldemat usa **Conta Azul** pro financeiro. A intenção **não** é substituir o que ele faz bem (boleto, banco, NF, conciliação), e sim ter um **controle financeiro simples e funcional dentro do próprio sistema**, amarrado aos **pedidos** que já vivem aqui — para ver saldo, o que há a pagar/receber e o fluxo sem depender de redigitar em outro lugar. Palavra do usuário: **"não precisa ser sofisticado, precisa ser funcional."**

## Objetivos (escopo enxuto aprovado)

1. **Contas/caixas:** cadastro simples (banco/caixa) com saldo inicial.
2. **Lançamentos:** um só lugar pra **entradas (receita) e saídas (despesa)** com descrição, valor, vencimento, data de pagamento/recebimento, categoria, conta, cliente/fornecedor e status **em aberto / pago**. Isso cobre, na prática, **contas a pagar** (despesas em aberto) e **contas a receber** (receitas em aberto).
3. **Pedido → conta a receber:** botão no pedido que **gera** o lançamento de receita (sem redigitar).
4. **Fluxo de caixa:** lista por período com saldo, separando **previsto** (em aberto) × **realizado** (pago).
5. **Dashboard financeiro:** saldo total em contas, total a pagar, total a receber, receitas/despesas e resultado do mês, saldo **previsto 7/15/30 dias**, inadimplência (vencido a receber), **alerta de saldo negativo previsto** e **2 gráficos** (receitas × despesas por mês; fluxo/saldo por mês).

## Não-objetivos (ficam de fora — "sofisticado")

Boleto/integração bancária, conciliação, parcelamento, recorrência, aprovação de pagamentos, anexos, régua de cobrança, cenários otimista/pessimista, centro de custo, cadastro dedicado de fornecedores (fornecedor é **campo de texto** por ora), categorias fixas (categoria é **texto livre** por ora).

## Anti-objetivos

- Virar "segunda verdade" que conflita com o Conta Azul sem querer: deixar claro na entrega que é controle interno simples.
- Número de saldo errado por misturar previsto com realizado: **saldo da conta só conta lançamentos PAGOS**; "previsto" é cálculo à parte.

## Decisões (minhas, dado "pode arrochar")

- **Permissão nova `pode_financeiro`** (área inteira). Admin sempre acessa.
- **Fornecedor** e **categoria** = texto livre (sem cadastro próprio agora).
- **Gráficos** leves, feitos à mão (SVG/CSS), **sem nova dependência** (mantém o bundle leve).
- **Pedido → receber:** gera 1 lançamento receita (valor = total do pedido, vencimento = hoje + 30, cliente e pedido vinculados, descrição "Pedido nº NNNNNN"); se já existir lançamento daquele pedido, **avisa** e não duplica.
- Seção em `/app/financeiro` com subnavegação interna: **Painel · Lançamentos · Contas · Fluxo**. Item "Financeiro" na barra lateral.
- Lógica de agregação do dashboard em **funções puras testáveis** (TDD), separadas da tela.

## Modelo de dados (migração `0006_financeiro.sql`)

`perfis.pode_financeiro boolean not null default false` (+ `tem_permissao` caso `'financeiro'`; + trigger anti-escalada).

```
contas_financeiras(
  id uuid pk, nome text not null,
  tipo text not null default 'banco' check (tipo in ('banco','caixa')),
  saldo_inicial numeric(12,2) not null default 0,
  ativo boolean not null default true)

lancamentos(
  id uuid pk, tipo text not null check (tipo in ('receita','despesa')),
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),
  vencimento date not null,
  pago_em date,                       -- null = em aberto; preenchido = realizado
  conta_id uuid references contas_financeiras(id),
  categoria text, fornecedor text,
  cliente_id uuid references clientes(id),
  pedido_id uuid references pedidos(id),
  obs text, usuario_id uuid references auth.users(id),
  created_at timestamptz not null default now())
```

View `saldo_contas`: por conta, `saldo_inicial + sum(receita paga) - sum(despesa paga)`.

RLS: contas_financeiras e lancamentos com select/insert/update (e delete em lancamentos) por `tem_permissao('financeiro')`.

## Frontend

- `src/app/financeiro/` — `financeiro.api.ts` (contas + lançamentos CRUD, saldos), `dashboard.ts` (funções puras de agregação), páginas: `FinanceiroPainel.tsx`, `LancamentosPage.tsx`, `ContasPage.tsx`, `FluxoPage.tsx`, e um layout com subnav `FinanceiroLayout.tsx`.
- Rotas `/app/financeiro` (índice = Painel), `/app/financeiro/lancamentos`, `/contas`, `/fluxo`, sob `RequireModulo modulo="financeiro"`.
- Nav lateral: "Financeiro" → `/app/financeiro`. Permissão em Funcionários (checkbox) + `admin-users` aceita `pode_financeiro`.
- `PedidoDetalhe`: botão **"Gerar conta a receber"**.
- Carga tolerante a falha (sobrevive à migração ainda não aplicada), como no catálogo de produtos.

## Agregações do dashboard (funções puras em `dashboard.ts`)

Entrada: lista de `lancamentos` + lista de contas com `saldo`. Saídas:
- `saldoTotal` = Σ saldo das contas.
- `totalAPagar` = Σ despesas em aberto; `totalAReceber` = Σ receitas em aberto.
- `doMes(hoje)` = receitas/despesas **pagas** no mês corrente; `resultadoMes` = receitas − despesas.
- `saldoPrevisto(dias)` = saldoTotal + Σ receitas em aberto com vencimento ≤ hoje+dias − Σ despesas em aberto idem (para 7/15/30).
- `inadimplencia(hoje)` = Σ receitas em aberto com vencimento < hoje (vencido a receber).
- `proximosVencimentos(hoje, dias)` = lançamentos em aberto vencendo até hoje+dias, ordenados.
- `serieMensal(n)` = por mês (últimos n): receitas pagas, despesas pagas, saldo do mês (para os gráficos).
- `alertaSaldoNegativo` = algum saldoPrevisto(7/15/30) < 0.

## O que fica a cargo do construtor

- TDD nas funções puras de agregação e nas APIs; componentes com testes de comportamento-chave; manter a suíte verde.
- Seguir padrões do repo (CRUD estilo clientes/produtos; money.ts; RLS estilo 0002).
- Gráficos simples e legíveis (rótulos claros, cores acessíveis).
- Verificação de schema/trigger é por revisão + aplicação na Supabase (sem Docker aqui), como nas rodadas anteriores.
