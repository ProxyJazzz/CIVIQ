-- ============================================================
-- Migration: Community Intelligence Layer
-- Tables: votes, comments, report_verifications
-- ============================================================

-- ── Fix reports category check constraint to include new categories ──────────
alter table public.reports
  drop constraint if exists reports_category_check;

alter table public.reports
  add constraint reports_category_check
  check (category in (
    'Pothole', 'Garbage', 'Water Leakage', 'Streetlight',
    'Road Damage', 'Drainage', 'Other'
  ));

-- Fix reports RLS: community feed must be readable by everyone
drop policy if exists "Users can read their own reports" on public.reports;

create policy "Anyone can read reports"
  on public.reports
  for select
  using (true);

-- Make report-images bucket public for CDN serving
update storage.buckets
  set public = true
  where id = 'report-images';

-- Drop private image read policy, add public one
drop policy if exists "Users can read report images" on storage.objects;

create policy "Anyone can read report images"
  on storage.objects
  for select
  using (bucket_id = 'report-images');

-- ── votes ────────────────────────────────────────────────────────────────────

create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  report_id  uuid not null references public.reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_user_report_unique unique (user_id, report_id)
);

alter table public.votes enable row level security;

create index if not exists votes_report_id_idx on public.votes(report_id);
create index if not exists votes_user_id_idx   on public.votes(user_id);

create policy "Anyone can read votes"
  on public.votes for select using (true);

create policy "Users can insert their own votes"
  on public.votes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own votes"
  on public.votes for delete
  using (auth.uid() = user_id);

-- ── comments ─────────────────────────────────────────────────────────────────

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  report_id  uuid not null references public.reports(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create index if not exists comments_report_id_idx on public.comments(report_id);
create index if not exists comments_user_id_idx   on public.comments(user_id);

create policy "Anyone can read comments"
  on public.comments for select using (true);

create policy "Users can insert their own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- ── report_verifications ─────────────────────────────────────────────────────

create table if not exists public.report_verifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  report_id  uuid not null references public.reports(id) on delete cascade,
  verified   boolean not null default true,
  created_at timestamptz not null default now(),
  constraint report_verifications_user_report_unique unique (user_id, report_id)
);

alter table public.report_verifications enable row level security;

create index if not exists verifications_report_id_idx on public.report_verifications(report_id);
create index if not exists verifications_user_id_idx   on public.report_verifications(user_id);

create policy "Anyone can read verifications"
  on public.report_verifications for select using (true);

create policy "Users can insert their own verifications"
  on public.report_verifications for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own verifications"
  on public.report_verifications for delete
  using (auth.uid() = user_id);
