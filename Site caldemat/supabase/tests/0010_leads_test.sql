begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- Fixtures (como superusuário, RLS não se aplica)
-- d1 = usuário comum (sem permissões); d2 = admin
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000d2');
insert into public.perfis (id, nome, is_admin) values
  ('00000000-0000-0000-0000-0000000000d1', 'Comum', false),
  ('00000000-0000-0000-0000-0000000000d2', 'Admin', true);

-- ===== Anônimo (visitante da LP) =====
set local role anon;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);

-- (a) anon consegue inserir um lead (formulário público)
select lives_ok(
  $$insert into public.leads (nome, whatsapp, cidade) values ('Lead Anon', '65999990000', 'Sorriso-MT')$$,
  '(a) anon pode inserir lead pela LP');
-- (b) anon NÃO lê leads
select is((select count(*)::int from public.leads), 0, '(b) anon nao enxerga leads');

-- ===== Usuário comum, pode_leads = false =====
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);

-- (c) sem pode_leads -> 0 linhas
select is((select count(*)::int from public.leads), 0, '(c) pode_leads=false: select em leads retorna 0 linhas');
-- (d) sem escalada: nao-admin nao pode se dar pode_leads
select throws_ok(
  $$update public.perfis set pode_leads = true where id = '00000000-0000-0000-0000-0000000000d1'$$,
  'apenas administradores podem alterar permissões',
  '(d) nao-admin nao pode se conceder pode_leads');

-- ===== Concede pode_leads (como superusuário, sem sessão) =====
reset role;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);
update public.perfis set pode_leads = true where id = '00000000-0000-0000-0000-0000000000d1';

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);

-- (e) com pode_leads -> vê o lead inserido pelo anon
select is((select count(*)::int from public.leads), 1, '(e) pode_leads=true: select retorna o lead');
-- (f) com pode_leads -> pode atualizar o status
select lives_ok(
  $$update public.leads set status = 'contatado' where nome = 'Lead Anon'$$,
  '(f) pode_leads=true: atualiza status do lead');
select is((select status from public.leads where nome = 'Lead Anon'), 'contatado',
  '(f2) status gravado como contatado');

-- ===== Admin =====
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d2', true);
-- (g) admin vê leads mesmo sem a flag
select is((select count(*)::int from public.leads), 1, '(g) admin enxerga leads sem a flag pode_leads');

select * from finish();
rollback;
