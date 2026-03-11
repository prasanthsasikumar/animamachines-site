-- Augmented Humans: express demo/event sessions
-- Run: supabase db push (or paste in Supabase SQL Editor)

create table if not exists public.augmented_human_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  -- Storage paths (characters bucket: {user_id}/augmented/{id}/...)
  capture_photo_path text,
  fullbody_photo_path text,
  model_glb_path text,
  animated_glb_path text,
  -- Affective / wellbeing scores
  sleep_score smallint check (sleep_score >= 1 and sleep_score <= 10),
  arousal smallint check (arousal >= 1 and arousal <= 9),   -- SAM arousal 1–9
  valence smallint check (valence >= 1 and valence <= 9),   -- SAM valence 1–9
  -- Metadata
  client_timestamp timestamptz,
  client_timezone text,
  user_agent text,
  -- Meshy task ids, etc.
  config jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_augmented_human_sessions_user_id
  on public.augmented_human_sessions(user_id);
create index if not exists idx_augmented_human_sessions_created_at
  on public.augmented_human_sessions(created_at desc);

-- RLS
alter table public.augmented_human_sessions enable row level security;

-- Users can CRUD own sessions (user_id = auth.uid())
create policy "Users can read own augmented sessions"
  on public.augmented_human_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own augmented sessions"
  on public.augmented_human_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own augmented sessions"
  on public.augmented_human_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own augmented sessions"
  on public.augmented_human_sessions for delete
  using (auth.uid() = user_id);

-- Storage: allow augmented paths under user folder
-- Path format: {user_id}/augmented/{session_id}/capture.png etc.
create policy "Users can upload augmented session assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'characters'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'augmented'
  );

create policy "Users can read augmented session assets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'characters'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'augmented'
  );
