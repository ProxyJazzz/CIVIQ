-- ============================================================
-- Migration: Fix Profiles RLS for Community Features
-- Drops the restrictive self-only select policy and adds public read
-- ============================================================

drop policy if exists "Users can read their own profile" on public.profiles;

create policy "Anyone can read profiles"
  on public.profiles
  for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);
