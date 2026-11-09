-- 0010: captação de leads pela LP de orçamento.
-- Inserção pública (anônima) permitida; leitura/edição só com pode_leads (ou admin).
-- Estoque/pedidos/etc. não são afetados.

-- Permissão nova: pode_leads (aba Leads na gestão).
alter table public.perfis add column if not exists pode_leads boolean not null default false;

-- tem_permissao: inclui o módulo 'leads' (baseado na versão atual de 0006_financeiro.sql).
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
          when 'leads'         then p.pode_leads
          else false end)
       from public.perfis p where p.id = auth.uid()),
    false);
$$;

-- perfis_bloqueia_escalada: inclui pode_leads (baseado na versão atual de 0006_financeiro.sql).
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
       or new.pode_leads is distinct from old.pode_leads
       or new.ativo is distinct from old.ativo then
      raise exception 'apenas administradores podem alterar permissões';
    end if;
  end if;
  return new;
end; $$;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  nome text not null,
  whatsapp text not null,
  documento text,
  capacidade_litros numeric,
  bacia_contencao boolean,
  cidade text,
  status text not null default 'novo' check (status in ('novo', 'contatado', 'ganho', 'perdido')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  obs text
);
create index leads_criado_em_idx on public.leads (criado_em desc);

alter table public.leads enable row level security;

-- Inserção pública: a LP é um formulário aberto (anônimo e autenticado podem inserir).
create policy leads_insert_anon on public.leads for insert to anon with check (true);
create policy leads_insert_auth on public.leads for insert to authenticated with check (true);

-- Leitura/edição: só quem tem permissão de leads (ou admin). Anônimo não lê.
create policy leads_select on public.leads for select to authenticated
  using (public.tem_permissao('leads'));
create policy leads_update on public.leads for update to authenticated
  using (public.tem_permissao('leads')) with check (public.tem_permissao('leads'));
