-- Anima Machines: initial schema for auth, avatars, subscriptions, credits, newsletter
-- Run this in Supabase SQL Editor or via `supabase db push` if using Supabase CLI.

-- Profiles (extends Supabase auth.users; id = auth.uid())
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subscriptions (synced from Stripe webhooks)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null default 'inactive',
  plan_code text not null default 'free',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_sub_id on public.subscriptions(stripe_subscription_id);

-- Entitlements (plan limits; can be derived from plan_code or stored per user)
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  avatar_slot_limit int not null default 1,
  monthly_credits int not null default 500,
  plan_code text not null default 'free',
  updated_at timestamptz not null default now()
);

create index if not exists idx_entitlements_user_id on public.entitlements(user_id);

-- Avatars (characters; count toward avatar_slot_limit)
create table if not exists public.avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  config jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_avatars_user_id on public.avatars(user_id);

-- Credit ledger (immutable entries; balance = sum(amount) per user)
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,
  type text not null check (type in ('grant_monthly', 'topup', 'spend', 'adjustment')),
  source text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_ledger_user_id on public.credit_ledger(user_id);
create index if not exists idx_credit_ledger_created_at on public.credit_ledger(created_at desc);

-- Newsletter subscribers (early access signup + consent)
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  consent_at timestamptz not null default now(),
  consent_source text default 'landing',
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_newsletter_subscribers_email on public.newsletter_subscribers(email);
create index if not exists idx_newsletter_subscribers_status on public.newsletter_subscribers(status);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  insert into public.entitlements (user_id, avatar_slot_limit, monthly_credits, plan_code)
  values (new.id, 1, 500, 'free');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;
alter table public.avatars enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Profiles: user can read/update own
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Subscriptions: user can read own
create policy "Users can read own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- Entitlements: user can read own
create policy "Users can read own entitlements" on public.entitlements for select using (auth.uid() = user_id);

-- Avatars: user can crud own
create policy "Users can read own avatars" on public.avatars for select using (auth.uid() = user_id);
create policy "Users can insert own avatars" on public.avatars for insert with check (auth.uid() = user_id);
create policy "Users can update own avatars" on public.avatars for update using (auth.uid() = user_id);
create policy "Users can delete own avatars" on public.avatars for delete using (auth.uid() = user_id);

-- Credit ledger: user can read own; inserts only via service role / backend
create policy "Users can read own credit_ledger" on public.credit_ledger for select using (auth.uid() = user_id);

-- Newsletter: anon can insert (signup); update/delete via API with service role or token
create policy "Allow insert for newsletter signup" on public.newsletter_subscribers for insert with check (true);
create policy "Allow select by user for own email" on public.newsletter_subscribers for select using (auth.uid() = user_id);
