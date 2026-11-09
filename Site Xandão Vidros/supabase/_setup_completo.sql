-- ============================================================
-- Xandão Vidros — setup completo do banco (migrations 0001–0009)
-- Cole TUDO isto de uma vez no SQL Editor do Supabase e rode.
-- Gerado em 2026-11-09.
-- ============================================================


-- ===== migrations/0001_schema.sql =====
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


-- ===== migrations/0002_rls.sql =====
-- RLS e modelo de permissões. Cada tabela é condicionada à flag do módulo em perfis.

-- Helpers (security definer: leem perfis sem passar por RLS, evitando recursão nas policies de perfis).
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin and p.ativo from public.perfis p where p.id = auth.uid()),
    false);
$$;

create or replace function public.tem_permissao(modulo text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Sem sessão (auth.uid() nulo) ou sem perfil: nenhuma linha -> coalesce -> false.
  select coalesce(
    (select p.ativo and (
        p.is_admin
        or case modulo
             when 'materia_prima' then p.pode_materia_prima
             when 'estoque'       then p.pode_estoque
             when 'clientes'      then p.pode_clientes
             when 'pedidos'       then p.pode_pedidos
             else false
           end)
       from public.perfis p
      where p.id = auth.uid()),
    false);
$$;

revoke all on function public.eh_admin() from public;
revoke all on function public.tem_permissao(text) from public;
grant execute on function public.eh_admin() to anon, authenticated;
grant execute on function public.tem_permissao(text) to anon, authenticated;

-- Views rodam com os direitos de quem consulta (PG15+), respeitando o RLS das tabelas base.
alter view public.saldo_estoque set (security_invoker = true);
alter view public.pedidos_total set (security_invoker = true);

alter table public.perfis                enable row level security;
alter table public.materiais_prima       enable row level security;
alter table public.movimentacoes_estoque enable row level security;
alter table public.clientes              enable row level security;
alter table public.pedidos               enable row level security;
alter table public.pedido_itens          enable row level security;

-- perfis: próprio registro (leitura/edição) ou admin (tudo).
create policy perfis_select on public.perfis for select to authenticated
  using (id = auth.uid() or public.eh_admin());
create policy perfis_insert on public.perfis for insert to authenticated
  with check (public.eh_admin());
create policy perfis_update on public.perfis for update to authenticated
  using (id = auth.uid() or public.eh_admin())
  with check (id = auth.uid() or public.eh_admin());
create policy perfis_delete on public.perfis for delete to authenticated
  using (public.eh_admin());

-- Impede escalada de privilégio: não-admin com sessão não pode alterar flags/ativo (nem o próprio).
create or replace function public.perfis_bloqueia_escalada()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.eh_admin() then
    if new.id is distinct from old.id
       or new.is_admin is distinct from old.is_admin
       or new.pode_materia_prima is distinct from old.pode_materia_prima
       or new.pode_estoque is distinct from old.pode_estoque
       or new.pode_clientes is distinct from old.pode_clientes
       or new.pode_pedidos is distinct from old.pode_pedidos
       or new.ativo is distinct from old.ativo then
      raise exception 'apenas administradores podem alterar permissões';
    end if;
  end if;
  return new;
end;
$$;
create trigger perfis_bloqueia_escalada before update on public.perfis
  for each row execute function public.perfis_bloqueia_escalada();

-- materiais_prima <-> materia_prima
create policy materiais_prima_select on public.materiais_prima for select to authenticated
  using (public.tem_permissao('materia_prima'));
create policy materiais_prima_insert on public.materiais_prima for insert to authenticated
  with check (public.tem_permissao('materia_prima'));
create policy materiais_prima_update on public.materiais_prima for update to authenticated
  using (public.tem_permissao('materia_prima')) with check (public.tem_permissao('materia_prima'));

-- movimentacoes_estoque <-> estoque (registro imutável: sem update/delete)
create policy movimentacoes_estoque_select on public.movimentacoes_estoque for select to authenticated
  using (public.tem_permissao('estoque'));
create policy movimentacoes_estoque_insert on public.movimentacoes_estoque for insert to authenticated
  with check (public.tem_permissao('estoque'));

-- clientes <-> clientes
create policy clientes_select on public.clientes for select to authenticated
  using (public.tem_permissao('clientes'));
create policy clientes_insert on public.clientes for insert to authenticated
  with check (public.tem_permissao('clientes'));
create policy clientes_update on public.clientes for update to authenticated
  using (public.tem_permissao('clientes')) with check (public.tem_permissao('clientes'));

-- pedidos e pedido_itens <-> pedidos
create policy pedidos_select on public.pedidos for select to authenticated
  using (public.tem_permissao('pedidos'));
create policy pedidos_insert on public.pedidos for insert to authenticated
  with check (public.tem_permissao('pedidos'));
create policy pedidos_update on public.pedidos for update to authenticated
  using (public.tem_permissao('pedidos')) with check (public.tem_permissao('pedidos'));
create policy pedidos_delete on public.pedidos for delete to authenticated
  using (public.tem_permissao('pedidos'));

create policy pedido_itens_select on public.pedido_itens for select to authenticated
  using (public.tem_permissao('pedidos'));
create policy pedido_itens_insert on public.pedido_itens for insert to authenticated
  with check (public.tem_permissao('pedidos'));
create policy pedido_itens_update on public.pedido_itens for update to authenticated
  using (public.tem_permissao('pedidos')) with check (public.tem_permissao('pedidos'));
create policy pedido_itens_delete on public.pedido_itens for delete to authenticated
  using (public.tem_permissao('pedidos'));


-- ===== migrations/0003_cadastro_campos.sql =====
-- 0003: campos técnicos + número automático na matéria-prima e dados cadastrais no perfil.

-- Matéria-prima: número sequencial automático (nativo do sistema) + atributos técnicos.
alter table public.materiais_prima
  add column if not exists codigo bigint generated by default as identity,
  add column if not exists forma text,
  add column if not exists norma_tecnica text,
  add column if not exists grau_liga text,
  add column if not exists espessura numeric,
  add column if not exists largura numeric,
  add column if not exists comprimento numeric,
  add column if not exists diametro_externo numeric,
  add column if not exists espessura_parede numeric,
  add column if not exists acabamento text,
  add column if not exists propriedades text;

-- Cada item recebe um número único (além do id uuid), para referência humana.
create unique index if not exists materiais_prima_codigo_idx on public.materiais_prima (codigo);

-- Movimentações de estoque: unidade de medida escolhida no registro (entrada/saída).
alter table public.movimentacoes_estoque
  add column if not exists unidade text;

-- Pedidos: ciclo de status (emitido → aprovado/reprovado → faturado) + data de faturamento.
alter table public.pedidos
  add column if not exists status text not null default 'emitido',
  add column if not exists faturado_em timestamptz;
alter table public.pedidos drop constraint if exists pedidos_status_chk;
alter table public.pedidos add constraint pedidos_status_chk
  check (status in ('emitido', 'aprovado', 'reprovado', 'faturado'));

-- Perfis (funcionários): dados cadastrais além de login/senha/permissões.
alter table public.perfis
  add column if not exists cpf text,
  add column if not exists telefone text,
  add column if not exists cargo text,
  add column if not exists data_admissao date,
  add column if not exists email text;


-- ===== migrations/0004_pedido_blocos.sql =====
-- 0004: pedido em 3 blocos (proposta/orçamento).
-- Bloco 3 (informações adicionais) no pedido + observação por item (bloco 2).

alter table public.pedidos
  add column if not exists prazo_entrega text,
  add column if not exists forma_pagamento text;

alter table public.pedido_itens
  add column if not exists obs text;


-- ===== migrations/0005_produtos_numeracao.sql =====
-- 0005: catálogo de Produtos/Serviços (preço de venda), numeração nativa de
-- pedido e fatura, e item de pedido com cálculo automático por medida.
-- Estoque e pedidos/produtos seguem independentes (sem FK/trigger entre eles).

-- ---------------------------------------------------------------------------
-- Catálogo de Produtos/Serviços (cadastro do gerente comercial).
-- ---------------------------------------------------------------------------
create table if not exists public.produtos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  unidade     text not null,
  valor_venda numeric(12,2) not null check (valor_venda >= 0),
  descricao   text,
  ativo       boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Permissão nova: pode_produtos (página Produtos/Serviços).
-- ---------------------------------------------------------------------------
alter table public.perfis
  add column if not exists pode_produtos boolean not null default false;

-- tem_permissao: inclui o módulo 'produtos'.
create or replace function public.tem_permissao(modulo text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.ativo and (
        p.is_admin
        or case modulo
             when 'materia_prima' then p.pode_materia_prima
             when 'estoque'       then p.pode_estoque
             when 'clientes'      then p.pode_clientes
             when 'pedidos'       then p.pode_pedidos
             when 'produtos'      then p.pode_produtos
             else false
           end)
       from public.perfis p
      where p.id = auth.uid()),
    false);
$$;

-- perfis_bloqueia_escalada: inclui pode_produtos.
create or replace function public.perfis_bloqueia_escalada()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.eh_admin() then
    if new.id is distinct from old.id
       or new.is_admin is distinct from old.is_admin
       or new.pode_materia_prima is distinct from old.pode_materia_prima
       or new.pode_estoque is distinct from old.pode_estoque
       or new.pode_clientes is distinct from old.pode_clientes
       or new.pode_pedidos is distinct from old.pode_pedidos
       or new.pode_produtos is distinct from old.pode_produtos
       or new.ativo is distinct from old.ativo then
      raise exception 'apenas administradores podem alterar permissões';
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Numeração nativa do pedido (identity) e da fatura (sequence por trigger).
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'pedidos' and column_name = 'numero'
  ) then
    alter table public.pedidos add column numero bigint;
    with ord as (select id, row_number() over (order by data, id) as rn from public.pedidos)
      update public.pedidos p set numero = ord.rn from ord where ord.id = p.id;
    alter table public.pedidos alter column numero set not null;
    alter table public.pedidos alter column numero add generated by default as identity;
    perform setval(pg_get_serial_sequence('public.pedidos', 'numero'),
                   coalesce((select max(numero) from public.pedidos), 0) + 1, false);
  end if;
end $$;
create unique index if not exists pedidos_numero_idx on public.pedidos (numero);

alter table public.pedidos add column if not exists fatura_numero bigint;
create sequence if not exists public.faturas_numero_seq;

-- Atribui número de fatura (imutável) quando o pedido passa a 'faturado'.
create or replace function public.pedidos_atribui_fatura()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'faturado' and new.fatura_numero is null then
    new.fatura_numero := nextval('public.faturas_numero_seq');
  end if;
  return new;
end;
$$;
drop trigger if exists pedidos_atribui_fatura on public.pedidos;
create trigger pedidos_atribui_fatura before update on public.pedidos
  for each row execute function public.pedidos_atribui_fatura();

-- ---------------------------------------------------------------------------
-- Item do pedido: produto (preço de sistema) + medidas + total calculado.
-- ---------------------------------------------------------------------------
alter table public.pedido_itens
  add column if not exists produto_id uuid references public.produtos (id),
  add column if not exists unidade text,
  add column if not exists largura numeric,
  add column if not exists altura numeric,
  add column if not exists descricao_adicional text,
  add column if not exists valor_total numeric(12,2);

-- Autoridade do servidor: em item de produto reaplica preço/unidade do cadastro
-- (preço fixo de sistema) e calcula o valor_total conforme a unidade.
create or replace function public.pedido_itens_calcula()
returns trigger
language plpgsql
as $$
declare
  v_venda numeric;
  v_unidade text;
  fator numeric;
begin
  if new.produto_id is not null then
    select valor_venda, unidade into v_venda, v_unidade
      from public.produtos where id = new.produto_id;
    if v_venda is null then
      raise exception 'produto do item não encontrado';
    end if;
    new.valor_unitario := v_venda;
    new.unidade := v_unidade;
  end if;

  fator := case
    when new.unidade = 'm²' then coalesce(new.largura, 0) * coalesce(new.altura, 0)
    when new.unidade in ('m', 'm linear', 'cm', 'mm') then coalesce(new.largura, 0)
    else 1
  end;
  new.valor_total := round(coalesce(new.quantidade, 0) * fator * coalesce(new.valor_unitario, 0), 2);
  return new;
end;
$$;
drop trigger if exists pedido_itens_calcula on public.pedido_itens;
create trigger pedido_itens_calcula before insert or update on public.pedido_itens
  for each row execute function public.pedido_itens_calcula();

-- Total do pedido passa a somar o valor_total calculado de cada item.
create or replace view public.pedidos_total as
select
  p.id as pedido_id,
  coalesce(sum(i.valor_total), 0)::numeric(12,2) as total
from public.pedidos p
left join public.pedido_itens i on i.pedido_id = p.id
group by p.id;
alter view public.pedidos_total set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- RLS do catálogo de produtos: leitura p/ quem tem 'produtos' OU 'pedidos'
-- (o pedido precisa listar produtos); escrita só p/ 'produtos'.
-- ---------------------------------------------------------------------------
alter table public.produtos enable row level security;
create policy produtos_select on public.produtos for select to authenticated
  using (public.tem_permissao('produtos') or public.tem_permissao('pedidos'));
create policy produtos_insert on public.produtos for insert to authenticated
  with check (public.tem_permissao('produtos'));
create policy produtos_update on public.produtos for update to authenticated
  using (public.tem_permissao('produtos')) with check (public.tem_permissao('produtos'));


-- ===== migrations/0006_financeiro.sql =====
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


-- ===== migrations/0007_estoque_conversao.sql =====
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


-- ===== migrations/0008_usuarios_nomes.sql =====
-- 0008: expõe id+nome dos usuários (para o filtro "Emitido por" nos pedidos),
-- sem abrir as permissões de perfis. Função security definer, guardada por permissão.
create or replace function public.usuarios_nomes()
returns table (id uuid, nome text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nome
  from public.perfis p
  where public.tem_permissao('pedidos') or public.tem_permissao('financeiro') or public.eh_admin();
$$;

revoke all on function public.usuarios_nomes() from public;
grant execute on function public.usuarios_nomes() to authenticated;


-- ===== migrations/0009_os_desconto.sql =====
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

