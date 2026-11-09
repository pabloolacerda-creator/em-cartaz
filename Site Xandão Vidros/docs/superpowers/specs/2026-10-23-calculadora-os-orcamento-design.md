# Desenho — Calculadora de chapa, área no item, e fluxo Orçamento→Pedido→OS

Data: 2026-10-23 · Projeto: Site Caldemat · Branch: `caldemat`

## Intenção
Três melhorias ligadas à venda: (1) calcular rápido o custo de uma chapa pela tabela de chapas grossas; (2) ver a área (m²) no item do pedido antes do valor; (3) renomear o documento conforme o estágio (Orçamento → Pedido) e gerar uma **Ordem de Serviço** para a produção, sem valores.

## Decisões do usuário
- Calculadora mostra **Área (m²) + Peso (kg) + Custo (R$)** (informa R$/kg) e **integra com o pedido**.
- OS ganha **número próprio ao gerar/imprimir** (nem todo pedido vira OS).
- **Obs de produção** é digitada **ao gerar a OS** (salva no pedido para reimpressão).

## Tabela de chapas grossas (fonte: foto do usuário)
Espessura(pol / mm) → peso kg/m²: 1/4"/6,30→49,39 · 5/16"/8,00→62,72 · 3/8"/9,50→74,48 · 1/2"/12,50→98,00 · 5/8"/16,00→125,44 · 3/4"/19,00→149,00 · 7/8"/22,40→175,84 · 1"/25,00→196,00 · 1.1/4"/31,50→247,27 · 1.1/2"/37,50→294,37 · 1.3/4"/44,45→348,50 · 2"/50,00→392,00 · 2.1/2"/63,00→494,55 · 3"/75,00→588,10 · 3.1/2"/88,90→697,80 · 4"/100,00→784,00.

## 1) Calculadora (`src/lib/chapa.ts` + aba)
- `CHAPAS` (lista acima) + `calcularChapa({ kgm2, largura, comprimento, quantidade, precoKg })` → `{ areaUnit, areaTotal, pesoUnit, pesoTotal, custoTotal }` (puro, TDD). Medidas em metros.
- Aba **Calculadora** (`/app/calculadora`, nav para quem tem `pedidos`): escolhe **espessura** (lista), informa **largura, comprimento, quantidade, R$/kg** → mostra área unit/total, peso unit/total e **custo total**.

## 2) Área no item do pedido
- No `PedidoForm`, item de produto em **m²**: mostrar **"= X m²"** (largura × altura) logo **antes** do valor total do item. (Também no `PedidoDetalhe`, já existe "Medidas"; acrescentar a área.)

## 3) Integração calculadora ↔ pedido
- No item do `PedidoForm`, o seletor ganha a opção **"— Calcular chapa —"** (além de produto e descrição livre). Escolhida: campos **Espessura, Largura, Comprimento, R$/kg** + Quantidade. O item vira um item **livre** cujo `descricao` = "Chapa <pol> <L>×<C> m (<peso> kg)" e `valor_unitario` = custo por unidade (custo total ÷ quantidade). Sem mudança de banco (produto_id nulo).

## 4) Orçamento → Pedido (nomenclatura por status)
- status `emitido`/`reprovado` → documento chamado **"Orçamento"**; `aprovado`/`faturado` → **"Pedido"**.
- Afeta: título do `PedidoDetalhe` e da impressão, cabeçalho do relatório da lista, e o título da seção de criação ("Novo orçamento"). A aba na barra continua "Pedidos" (minha decisão). Status/labels internos (Emitido/Aprovado/...) não mudam.

## 6) Desconto no pedido/orçamento
- `pedidos.desconto numeric(12,2) default 0` + `pedidos.desconto_tipo text default 'valor' check in ('valor','percentual')`.
- `PedidoForm`: campo **Desconto** com alternância **R$ / %** (perto do total). Ao vivo mostra **Subtotal → Desconto → Total**.
- Valor do desconto = `tipo==='percentual' ? round(subtotal*desconto/100,2) : desconto`. **Total final = subtotal − desconto** (nunca negativo).
- Impressão/`PedidoDetalhe`: mostrar **Subtotal**, **Desconto** (com "X%" quando percentual) e **Total** — visível pro cliente.
- Lista de pedidos, Faturamento (`FaturarDialog`) e lançamento no financeiro usam o **total final** (com desconto). O `pedidos_total` (view) continua sendo o **subtotal**; o desconto é aplicado no frontend.

## 5) Ordem de Serviço (OS)
- **Migração 0009**: `pedidos.os_numero bigint`, `pedidos.obs_producao text`, `pedidos.desconto numeric(12,2) default 0`, `pedidos.desconto_tipo text default 'valor' check (desconto_tipo in ('valor','percentual'))`; `sequence os_numero_seq`; função `gerar_os(p_id uuid) returns bigint` (security definer, guardada por `tem_permissao('pedidos')`): se `os_numero` nulo, grava `nextval` e retorna; senão retorna o existente.
- `PedidoDetalhe`: quando `aprovado`/`faturado`, botão **"Ordem de Serviço"** → rota `/app/pedidos/:id/os`.
- `PedidoOS.tsx` (`/app/pedidos/:id/os`, guardada por `pedidos`): ao abrir, chama `gerar_os` (garante número). Mostra a OS **pronta para impressão** com: **timbrado**, **"Ordem de Serviço nº <os_numero>"**, nº do pedido, cliente, data, **itens sem valores** (descrição, qtd, unidade, medidas), **prazo de entrega**, e um campo editável **Obs de produção** (prefill do que estiver salvo). Botões (no-print): **Salvar obs**, **Imprimir OS**, **Voltar**. Nunca mostra preços/totais.
- Números exibidos com `formatNumero` (6 dígitos).

## Não-objetivos
- Calculadora não salva histórico; R$/kg é digitado a cada uso (sem cadastro de preço de kg agora).
- OS não controla etapas de produção (é só o documento).

## A cargo do construtor
- TDD no `chapa.ts` e nas APIs novas; componentes com teste de comportamento-chave; manter a suíte verde (hoje 197).
- Reusar padrões do repo (print via `.no-print`/`.print-only` + timbrado; CRUD/rotas; `formatNumero`).
- Verificação de schema/trigger por revisão + aplicação na Supabase (sem Docker aqui).
