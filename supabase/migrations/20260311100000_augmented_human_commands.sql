-- Augmented Humans: tablet-to-Unity command queue
-- Allows the tablet web UI to send commands that Unity polls for.

create table if not exists public.augmented_human_commands (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.augmented_human_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  -- Command type: start, mode, answer, stop, reset, custom
  command text not null,
  -- Arbitrary payload (e.g. { "mode": 2 } or { "answer": "yes" })
  payload jsonb default '{}',
  -- Unity sets this once it has consumed the command
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ah_commands_session_created
  on public.augmented_human_commands(session_id, created_at desc);

create index if not exists idx_ah_commands_unacknowledged
  on public.augmented_human_commands(acknowledged_at)
  where acknowledged_at is null;

-- RLS
alter table public.augmented_human_commands enable row level security;

create policy "Users can insert own commands"
  on public.augmented_human_commands for insert
  with check (auth.uid() = user_id);

create policy "Users can read own commands"
  on public.augmented_human_commands for select
  using (auth.uid() = user_id);

-- Allow public/anon reads for Unity polling (no auth on Unity side)
create policy "Anon can read commands"
  on public.augmented_human_commands for select
  to anon
  using (true);

-- Allow anon updates for Unity to acknowledge commands
create policy "Anon can acknowledge commands"
  on public.augmented_human_commands for update
  to anon
  using (true)
  with check (true);
