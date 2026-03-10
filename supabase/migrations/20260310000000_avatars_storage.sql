-- Add storage_path to avatars for Supabase Storage GLB files
alter table public.avatars
  add column if not exists storage_path text;

-- Create storage bucket for character GLB files (private; users access via signed URLs)
insert into storage.buckets (id, name, public)
values ('characters', 'characters', false)
on conflict (id) do nothing;

-- Storage policies: users can upload/read/delete only in their own folder
-- Path format: {user_id}/{avatar_id}.glb
create policy "Users can upload own characters"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'characters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own characters"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'characters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own characters"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'characters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
