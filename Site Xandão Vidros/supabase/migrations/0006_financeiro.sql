-- 0006: módulo Financeiro — contas/caixas, lançamentos (a pagar/receber) e saldo.
-- Simples e funcional; independente do Conta Azul. Amarra lançamentos a pedidos/clientes.

create table if not exists public.contas_financeiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'banco' check (tipo in ('banco', 'caixa')),
  saldo_inicial numeric(12,2) not null default 0,
  ativo boolean not null default true
);

create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receita', 'despesa')),
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),
  vencimento date not null,
  pago_em date,                                 -- null = em aberto; preenchido = realizado
  conta_id uuid references public.contas_financeiras (id),
  categoria text,
  fornecedor text,
  cliente_id uuid references public.clientes (id),
  pedido_id uuid references public.pedidos (id),
  obs text,
  usuario_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index if not exists lancamentos_vencimento_idx on public.lancamentos (vencimento);
create index if not exists lancamentos_pedido_idx on public.lancamentos (pedido_id);

-- Permissão nova: pode_financeiro.
alter table public.perfis add column if not exists pode_financeiro boolean not null default false;

create or replace function public.tem_permissao(modulo text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.ativo and (p.is_admin or case modulo
          when 'materia_prima' then p.pode_materia_prima
          when 'estoque'       then p.pode_estoque
          when 'clientes'      then p.pode_clientes
          when 'pedidos'       then p.pode_pedidos
          when 'produtos'      then p.pode_produtos
          when 'financeiro'    then p.pode_financeiro
          else false end)
       from public.perfis p where p.id = auth.uid()),
    false);
$$;

create or replace function public.perfis_bloqueia_escalada()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.eh_admin() then
    if new.id is distinct from old.id
       or new.is_admin is distinct from old.is_admin
       or new.pode_materia_prima is distinct from old.pode_materia_prima
       or new.pode_estoque is distinct from old.pode_estoque
       or new.pode_clientes is distinct from old.pode_clientes
       or new.pode_pedidos is distinct from old.pode_pedidos
       or new.pode_produtos is distinct from old.pode_produtos
       or new.pode_financeiro is distinct from old.pode_financeiro
       or new.ativo is distinct from old.ativo then
      raise exception 'apenas administradores podem alterar permissões';
    end if;
  end if;
  return new;
end; $$;

-- Saldo por conta = saldo inicial + receitas pagas - despesas pagas (só realizados).
create or replace view public.saldo_contas as
select
  c.id as conta_id,
  c.nome,
  c.tipo,
  c.saldo_inicial
    + coalesce(sum(case when l.pago_em is not null and l.tipo = 'receita' then l.valor else 0 end), 0)
    - coalesce(sum(case when l.pago_em is not null and l.tipo = 'despesa' then l.valor else 0 end), 0)
    as saldo
from public.contas_financeiras c
left join public.lancamentos l on l.conta_id = c.id
group by c.id, c.nome, c.tipo, c.saldo_inicial;
alter view public.saldo_contas set (security_invoker = true);

-- RLS do financeiro.
alter table public.contas_financeiras enable row level security;
alter table public.lancamentos enable row level security;

create policy contas_financeiras_select on public.contas_financeiras for select to authenticated
  using (public.tem_permissao('financeiro'));
create policy contas_financeiras_insert on public.contas_financeiras for insert to authenticated
  with check (public.tem_permissao('financeiro'));
create policy contas_financeiras_update on public.contas_financeiras for update to authenticated
  using (public.tem_permissao('financeiro')) with check (public.tem_permissao('financeiro'));

create policy lancamentos_select on public.lancamentos for select to authenticated
  using (public.tem_permissao('financeiro'));
create policy lancamentos_insert on public.lancamentos for insert to authenticated
  with check (public.tem_permissao('financeiro'));
create policy lancamentos_update on public.lancamentos for update to authenticated
  using (public.tem_permissao('financeiro')) with check (public.tem_permissao('financeiro'));
create policy lancamentos_delete on public.lancamentos for delete to authenticated
  using (public.tem_permissao('financeiro'));
