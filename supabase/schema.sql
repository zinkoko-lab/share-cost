create extension if not exists pgcrypto;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  amount integer not null check (amount > 0),
  category text not null check (category in ('家賃', '食費', '日用品', '光熱費', '通信費', 'その他')),
  payer text not null check (payer in ('ME', 'SISTER')),
  memo text,
  is_settlement_target boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses
  add column if not exists created_by uuid references auth.users(id);

create index if not exists expenses_expense_date_idx on public.expenses (expense_date desc);
create index if not exists expenses_payer_idx on public.expenses (payer);

create table if not exists public.monthly_settlements (
  id uuid primary key default gen_random_uuid(),
  target_month text not null unique,
  is_confirmed boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_settlements_month_format check (target_month ~ '^[0-9]{4}-[0-9]{2}$')
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  payer_code text not null check (payer_code in ('ME', 'SISTER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
alter table public.monthly_settlements enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Allow full access for anon and authenticated" on public.expenses;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'expenses'
      and policyname = 'Authenticated users can manage expenses'
  ) then
    create policy "Authenticated users can manage expenses"
      on public.expenses
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'monthly_settlements'
      and policyname = 'Authenticated users can manage monthly settlements'
  ) then
    create policy "Authenticated users can manage monthly settlements"
      on public.monthly_settlements
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read all profiles'
  ) then
    create policy "Users can read all profiles"
      on public.profiles
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);
  end if;
end $$;
