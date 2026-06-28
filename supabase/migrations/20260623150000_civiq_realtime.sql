-- ============================================================
-- Migration: Realtime Platform Additions (Phase 7)
-- Tables: announcements, user_presence
-- Enablement: Supabase Realtime Replication
-- ============================================================

-- ── 1. announcements Table ─────────────────────────────────────────────────
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  severity    text not null check (severity in ('Info', 'Warning', 'Emergency')),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  created_by  uuid references public.profiles(id) on delete set null
);

-- Enable RLS
alter table public.announcements enable row level security;

-- Policies for announcements
create policy "Anyone can read active announcements"
  on public.announcements for select
  using (expires_at is null or expires_at > now());

create policy "Admins can manage announcements"
  on public.announcements for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── 2. user_presence Table ─────────────────────────────────────────────────
create table if not exists public.user_presence (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade unique,
  status       text not null default 'online' check (status in ('online', 'offline', 'away')),
  last_seen_at timestamptz not null default now()
);

-- Enable RLS
alter table public.user_presence enable row level security;

-- Policies for user_presence
create policy "Anyone can read user presence states"
  on public.user_presence for select
  using (true);

create policy "Users can manage their own presence status"
  on public.user_presence for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index on last seen for cleanup queries
create index if not exists user_presence_last_seen_at_idx on public.user_presence(last_seen_at);

-- ── 3. Enable Replication for Supabase Realtime ─────────────────────────────
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- Add public.reports
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reports'
    ) then
      alter publication supabase_realtime add table public.reports;
    end if;

    -- Add public.comments
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments'
    ) then
      alter publication supabase_realtime add table public.comments;
    end if;

    -- Add public.votes
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes'
    ) then
      alter publication supabase_realtime add table public.votes;
    end if;

    -- Add public.notifications
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;

    -- Add public.announcements
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'announcements'
    ) then
      alter publication supabase_realtime add table public.announcements;
    end if;

    -- Add public.user_presence
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_presence'
    ) then
      alter publication supabase_realtime add table public.user_presence;
    end if;

    -- Add public.report_verifications
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'report_verifications'
    ) then
      alter publication supabase_realtime add table public.report_verifications;
    end if;
  end if;
end $$;
