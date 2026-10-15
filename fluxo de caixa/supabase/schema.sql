-- Fluxo de caixa schema. Run in Supabase dashboard -> SQL Editor.

create table if not exists public.entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid() references auth.users,
  kind text not null check (kind in ('in','out')),
  name text not null,
  description text,
  amount_cents integer not null,
  paid_cents integer not null default 0,
  purchase_date date,
  due_date date,
  paid_date date,
  source_fixed_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.fixed_bills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid() references auth.users,
  kind text not null check (kind in ('in','out')),
  name text not null,
  description text,
  amount_cents integer not null,
  due_day integer not null check (due_day between 1 and 31),
  created_at timestamptz default now()
);

alter table public.entries enable row level security;
alter table public.fixed_bills enable row level security;

create unique index if not exists entries_fixed_once
  on public.entries (user_id, source_fixed_id, due_date) where source_fixed_id is not null;

drop policy if exists "entries owner only" on public.entries;
create policy "entries owner only" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "fixed_bills owner only" on public.fixed_bills;
create policy "fixed_bills owner only" on public.fixed_bills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
