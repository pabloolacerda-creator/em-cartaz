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
