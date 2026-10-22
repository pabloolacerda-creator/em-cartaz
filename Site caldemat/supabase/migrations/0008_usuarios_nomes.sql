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
