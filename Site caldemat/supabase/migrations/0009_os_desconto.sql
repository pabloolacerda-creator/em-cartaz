-- 0009: desconto no pedido/orçamento e Ordem de Serviço (número próprio + obs de produção).

alter table public.pedidos
  add column if not exists desconto numeric(12,2) not null default 0,
  add column if not exists desconto_tipo text not null default 'valor',
  add column if not exists os_numero bigint,
  add column if not exists obs_producao text;

alter table public.pedidos drop constraint if exists pedidos_desconto_tipo_chk;
alter table public.pedidos add constraint pedidos_desconto_tipo_chk
  check (desconto_tipo in ('valor', 'percentual'));
alter table public.pedidos drop constraint if exists pedidos_desconto_chk;
alter table public.pedidos add constraint pedidos_desconto_chk check (desconto >= 0);

create unique index if not exists pedidos_os_numero_idx on public.pedidos (os_numero);
create sequence if not exists public.os_numero_seq;

-- Gera (uma vez) o número da OS do pedido e devolve. Reimpressões mantêm o mesmo número.
create or replace function public.gerar_os(p_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
begin
  if not public.tem_permissao('pedidos') then
    raise exception 'sem permissão';
  end if;
  select os_numero into n from public.pedidos where id = p_id;
  if n is null then
    n := nextval('public.os_numero_seq');
    update public.pedidos set os_numero = n where id = p_id;
  end if;
  return n;
end;
$$;

revoke all on function public.gerar_os(uuid) from public;
grant execute on function public.gerar_os(uuid) to authenticated;
