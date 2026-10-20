-- Schema inicial: perfis, estoque de matéria-prima, clientes e pedidos.
-- Estoque e pedidos são independentes (sem FK/trigger entre eles). RLS fica na Task 3.
create extension if not exists pgcrypto;

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  is_admin boolean not null default false,
  pode_materia_prima boolean not null default false,
  pode_estoque boolean not null default false,
  pode_clientes boolean not null default false,
  pode_pedidos boolean not null default false,
  ativo boolean not null default true
);

create table public.materiais_prima (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  unidade text not null,
  estoque_minimo numeric,
  ativo boolean not null default true
);

create table public.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materiais_prima (id),
  tipo text not null check (tipo in ('entrada', 'saida')),
  quantidade numeric not null check (quantidade > 0),
  data timestamptz not null default now(),
  obs text,
  usuario_id uuid references auth.users (id)
);
create index movimentacoes_estoque_material_idx on public.movimentacoes_estoque (material_id);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  telefone text,
  email text,
  endereco text,
  obs text,
  ativo boolean not null default true
);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  data timestamptz not null default now(),
  obs text,
  usuario_id uuid references auth.users (id)
);
create index pedidos_cliente_idx on public.pedidos (cliente_id);

create table public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  descricao text not null,
  quantidade numeric not null check (quantidade > 0),
  valor_unitario numeric(12,2) not null check (valor_unitario >= 0)
);
create index pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

create view public.saldo_estoque as
select
  m.id as material_id,
  m.nome,
  m.unidade,
  coalesce(sum(case mv.tipo when 'entrada' then mv.quantidade when 'saida' then -mv.quantidade end), 0) as saldo
from public.materiais_prima m
left join public.movimentacoes_estoque mv on mv.material_id = m.id
group by m.id, m.nome, m.unidade;

create view public.pedidos_total as
select
  p.id as pedido_id,
  coalesce(sum(i.quantidade * i.valor_unitario), 0)::numeric(12,2) as total
from public.pedidos p
left join public.pedido_itens i on i.pedido_id = p.id
group by p.id;
