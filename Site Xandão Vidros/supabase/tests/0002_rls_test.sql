begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Fixtures (como superusuário, RLS não se aplica)
-- d1 = usuário comum (sem permissões); d2 = admin
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000d2');
insert into public.perfis (id, nome, is_admin, pode_pedidos) values
  ('00000000-0000-0000-0000-0000000000d1', 'Comum', false, false),
  ('00000000-0000-0000-0000-0000000000d2', 'Admin', true, false);
insert into public.clientes (id, nome) values ('00000000-0000-0000-0000-0000000000c1', 'Cliente Teste');
insert into public.pedidos (id, cliente_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1');
insert into public.pedido_itens (pedido_id, descricao, quantidade, valor_unitario) values
  ('00000000-0000-0000-0000-0000000000b1', 'Item A', 2, 10.00);

-- ===== Usuário comum, pode_pedidos = false =====
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);

-- (a) sem permissão em pedidos -> 0 linhas
select is((select count(*)::int from public.pedidos), 0, '(a) pode_pedidos=false: select em pedidos retorna 0 linhas');
-- views com security_invoker respeitam o RLS das tabelas base
select is((select count(*)::int from public.pedidos_total), 0, 'view pedidos_total (security_invoker) tambem retorna 0 linhas');
-- (c) perfil de outro usuário invisível; o próprio é visível
select is((select count(*)::int from public.perfis where id = '00000000-0000-0000-0000-0000000000d2'), 0,
  '(c) nao-admin nao enxerga perfil de outro usuario');
select is((select count(*)::int from public.perfis), 1, 'nao-admin enxerga apenas o proprio perfil');
-- sem escalada de privilégio
select throws_ok(
  $$update public.perfis set is_admin = true where id = '00000000-0000-0000-0000-0000000000d1'$$,
  'apenas administradores podem alterar permissões',
  'nao-admin nao pode se promover a admin');
-- escrita negada em tabela sem permissão
select throws_ok(
  $$insert into public.clientes (nome) values ('X')$$,
  '42501', null, 'sem pode_clientes: insert em clientes negado por RLS');

-- ===== Sem sessão (anon) =====
set local role anon;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);
select is(public.tem_permissao('pedidos'), false, 'anon: tem_permissao retorna false (sem erro)');

-- ===== Concede permissão (como superusuário, sem sessão) =====
reset role;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);
update public.perfis set pode_pedidos = true where id = '00000000-0000-0000-0000-0000000000d1';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);

-- (b) com permissão -> vê as linhas
select is((select count(*)::int from public.pedidos), 1, '(b) pode_pedidos=true: select em pedidos retorna as linhas');
select is((select count(*)::int from public.pedidos_total), 1, 'view pedidos_total retorna a linha com permissao');

-- ===== Admin =====
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d2', true);

-- (d) admin vê todos os perfis (e passa em qualquer módulo sem flag)
select is((select count(*)::int from public.perfis
            where id in ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000d2')), 2,
  '(d) admin enxerga todos os perfis');
select is(public.tem_permissao('estoque'), true, 'admin passa em tem_permissao mesmo sem a flag');

select * from finish();
rollback;
