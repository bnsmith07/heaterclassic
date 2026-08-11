-- Colonial Heater Classic — scoring app storage
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)

create table if not exists app_storage (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

alter table app_storage enable row level security;

-- Anyone with the anon key can read/write. Fine here: no personal data, just golf scores,
-- and the URL itself is the only thing gating access.
drop policy if exists "public read"   on app_storage;
drop policy if exists "public insert" on app_storage;
drop policy if exists "public update" on app_storage;
drop policy if exists "public delete" on app_storage;

create policy "public read"   on app_storage for select using (true);
create policy "public insert" on app_storage for insert with check (true);
create policy "public update" on app_storage for update using (true) with check (true);
create policy "public delete" on app_storage for delete using (true);

-- Optional: let the app receive live pushes instead of polling every 7s.
-- Safe to run even if it's already added.
do $$
begin
  alter publication supabase_realtime add table app_storage;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ============================================================
-- Weekend photo/video gallery
-- ============================================================
-- Creates a "gallery" storage bucket for uploaded photos/videos, public read
-- (anyone with a file's URL can view it — the app itself still only ever shows
-- these URLs to participants, never to public/view-only visitors) and anon
-- upload/delete, matching the same open-access approach as the scores table.
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

drop policy if exists "gallery public read" on storage.objects;
drop policy if exists "gallery public insert" on storage.objects;
drop policy if exists "gallery public delete" on storage.objects;

create policy "gallery public read" on storage.objects
  for select using (bucket_id = 'gallery');

create policy "gallery public insert" on storage.objects
  for insert with check (bucket_id = 'gallery');

create policy "gallery public delete" on storage.objects
  for delete using (bucket_id = 'gallery');

