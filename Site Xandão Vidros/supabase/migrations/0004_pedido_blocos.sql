-- 0004: pedido em 3 blocos (proposta/orçamento).
-- Bloco 3 (informações adicionais) no pedido + observação por item (bloco 2).

alter table public.pedidos
  add column if not exists prazo_entrega text,
  add column if not exists forma_pagamento text;

alter table public.pedido_itens
  add column if not exists obs text;
