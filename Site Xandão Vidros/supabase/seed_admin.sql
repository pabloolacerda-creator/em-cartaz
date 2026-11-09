-- Semeia o PRIMEIRO administrador.
-- Passo 1: no painel Supabase > Authentication > Users > "Add user" > "Create new user",
--          crie o usuario com e-mail  admin@caldemat.local  (ou <usuario>@caldemat.local),
--          defina uma senha e MARQUE "Auto Confirm User".
--          (O login no sistema e "usuario" + senha; o e-mail e sintetico: usuario@caldemat.local.)
-- Passo 2: rode este script no SQL Editor. Ele busca o id do usuario do Auth
--          (auth.users.id) e o usa como perfis.id. Se o perfil ja existir, apenas promove.
-- Altere o e-mail abaixo se escolheu outro usuario.

insert into public.perfis
  (id, nome, is_admin, pode_materia_prima, pode_estoque, pode_clientes, pode_pedidos, ativo)
select id, 'Administrador', true, true, true, true, true, true
from auth.users
where email = 'admin@caldemat.local'
on conflict (id) do update set
  is_admin = true,
  pode_materia_prima = true,
  pode_estoque = true,
  pode_clientes = true,
  pode_pedidos = true,
  ativo = true;

-- Conferencia: deve retornar 1 linha com is_admin = true.
select p.id, u.email, p.nome, p.is_admin
from public.perfis p join auth.users u on u.id = p.id
where u.email = 'admin@caldemat.local';
