-- 0007: saldo de estoque convertendo a unidade de cada movimentação para a
-- unidade do material (ex.: saída de 100 cm num material em "m" = 1 m).
-- A conversão só faz sentido dentro da mesma família (comprimento/peso/contagem);
-- o frontend só oferece unidades compatíveis.

create or replace function public.fator_unidade(u text)
returns numeric language sql immutable as $$
  select case u
    when 'm' then 1 when 'm linear' then 1 when 'cm' then 0.01 when 'mm' then 0.001
    when 'Quilo(s)' then 1 when 'Grama(s)' then 0.001
    when 'Unidade(s)' then 1 when 'Dúzia(s)' then 12 when 'Cento(s)' then 100 when 'Milhar(es)' then 1000
    when 'Litro(s)' then 1 when 'm²' then 1 when 'Hora(s)' then 1
    else 1 end::numeric;
$$;

create or replace view public.saldo_estoque as
select
  m.id as material_id,
  m.nome,
  m.unidade,
  coalesce(sum(
    (case mv.tipo when 'entrada' then 1 when 'saida' then -1 else 0 end)
    * mv.quantidade
    * public.fator_unidade(coalesce(mv.unidade, m.unidade))
    / public.fator_unidade(m.unidade)
  ), 0) as saldo
from public.materiais_prima m
left join public.movimentacoes_estoque mv on mv.material_id = m.id
group by m.id, m.nome, m.unidade;
alter view public.saldo_estoque set (security_invoker = true);
