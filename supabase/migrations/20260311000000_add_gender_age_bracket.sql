-- Add gender and age_bracket columns to augmented_human_sessions
alter table public.augmented_human_sessions
  add column if not exists gender text check (gender in ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  add column if not exists age_bracket text check (age_bracket in ('under-18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'));
