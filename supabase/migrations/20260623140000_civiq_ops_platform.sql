-- ============================================================
-- Migration: Civic Operations Platform (Phase 6)
-- Tables: departments, report_events, admin_notes, notifications
-- Views: user_leaderboard, reports_with_stats (updated)
-- ============================================================

-- ── 1. profiles Extension ──────────────────────────────────────────────────
-- Add role column to profiles if it does not exist
alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

-- ── 2. departments Table ───────────────────────────────────────────────────
create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.departments enable row level security;

-- Policies for departments
create policy "Anyone can read departments"
  on public.departments for select using (true);

create policy "Only admins can insert departments"
  on public.departments for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Only admins can update departments"
  on public.departments for update
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

create policy "Only admins can delete departments"
  on public.departments for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Seed default departments
insert into public.departments (name, description)
values
  ('Public Works & Roads', 'Road damage, street structures, potholes, and sidewalks'),
  ('Sanitation & Waste', 'Garbage collection, littering, illegal dumping, and public cleanliness'),
  ('Water Resources & Drainage', 'Water leakage, flooding, drainage issues, and sewer blockages'),
  ('Street & Electrical Operations', 'Streetlights, traffic lights, and public electrical fixtures'),
  ('Traffic & Transportation', 'Traffic congestion, parking violations, and signage issues'),
  ('General Civic Services', 'Other generic public infrastructure and general services')
on conflict (name) do nothing;

-- ── 3. Extend reports Table ───────────────────────────────────────────────
alter table public.reports
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists assigned_at timestamptz;

-- Update/Add status check constraint
alter table public.reports
  drop constraint if exists reports_status_check;

alter table public.reports
  add constraint reports_status_check
  check (status in ('pending', 'assigned', 'in_progress', 'resolved', 'dismissed'));

-- Add policy for admins to update reports
create policy "Admins can update any report"
  on public.reports for update
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

-- ── 4. report_events Table ──────────────────────────────────────────────────
create table if not exists public.report_events (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  event_type  text not null, -- 'created', 'status_change', 'department_assignment', 'admin_note_added'
  from_status text,
  to_status   text,
  description text not null,
  created_at  timestamptz not null default now()
);

-- Enable RLS
alter table public.report_events enable row level security;

-- Policies for report_events
create policy "Anyone can read report_events"
  on public.report_events for select using (true);

create policy "Authenticated users can insert report_events"
  on public.report_events for insert
  with check (auth.uid() is not null);

-- Index for fast status timeline query
create index if not exists report_events_report_id_idx on public.report_events(report_id);

-- ── 5. admin_notes Table ───────────────────────────────────────────────────
create table if not exists public.admin_notes (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  note       text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.admin_notes enable row level security;

-- Policies for admin_notes
create policy "Only admins can select admin_notes"
  on public.admin_notes for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can insert admin_notes"
  on public.admin_notes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update their own admin_notes"
  on public.admin_notes for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete their own admin_notes"
  on public.admin_notes for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index if not exists admin_notes_report_id_idx on public.admin_notes(report_id);

-- ── 6. notifications Table ─────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  report_id  uuid references public.reports(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null, -- 'status_change', 'comment', 'department_assignment'
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies for notifications
create policy "Users can read their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert notifications"
  on public.notifications for insert
  with check (auth.uid() is not null);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

create index if not exists notifications_user_id_idx on public.notifications(user_id);

-- ── 7. Recreate views to support new columns ──────────────────────────────
drop view if exists public.reports_with_stats;

create or replace view public.reports_with_stats
with (security_invoker = on) as
select
  r.*,
  coalesce(v.count, 0)::integer as vote_count,
  coalesce(c.count, 0)::integer as comment_count,
  coalesce(rv.count, 0)::integer as verification_count,
  -- Trust Score = 0.5 * verifications + 0.2 * votes + 0.1 * comments + 0.2 * age_factor (days, max 30)
  (
    0.5 * coalesce(rv.count, 0) +
    0.2 * coalesce(v.count, 0) +
    0.1 * coalesce(c.count, 0) +
    0.2 * (least(extract(epoch from (now() - r.created_at)) / 86400, 30.0) / 3.0)
  )::float as trust_score,
  -- Hot Trending Score = (votes * 2 + verifications * 5 + comments * 1 + 1) / (age_hours + 2)^1.5
  (
    (coalesce(v.count, 0) * 2 + coalesce(rv.count, 0) * 5 + coalesce(c.count, 0) * 1 + 1) /
    power((extract(epoch from (now() - r.created_at)) / 3600 + 2.0), 1.5)
  )::float as trending_score
from public.reports r
left join (
  select report_id, count(*) as count
  from public.votes
  group by report_id
) v on v.report_id = r.id
left join (
  select report_id, count(*) as count
  from public.comments
  group by report_id
) c on c.report_id = r.id
left join (
  select report_id, count(*) as count
  from public.report_verifications
  group by report_id
) rv on rv.report_id = r.id;

-- Create user_leaderboard view
create or replace view public.user_leaderboard as
select
  p.id,
  p.full_name,
  p.avatar_url,
  coalesce(r.count, 0)::integer as reports_count,
  coalesce(v.count, 0)::integer as verifications_count,
  coalesce(vt.count, 0)::integer as votes_count,
  (coalesce(r.count, 0) * 10 + coalesce(v.count, 0) * 5 + coalesce(vt.count, 0) * 2)::integer as score
from public.profiles p
left join (
  select user_id, count(*) as count from public.reports group by user_id
) r on r.user_id = p.id
left join (
  select user_id, count(*) as count from public.report_verifications group by user_id
) v on v.user_id = p.id
left join (
  select user_id, count(*) as count from public.votes group by user_id
) vt on vt.user_id = p.id
order by score desc;

-- ── 8. Database Triggers for Automation ─────────────────────────────────────

-- A. Report creation event trigger
create or replace function public.handle_report_created_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.report_events (report_id, user_id, event_type, description)
  values (
    new.id,
    new.user_id,
    'created',
    'Report submitted successfully.'
  );
  return new;
end;
$$;

create or replace trigger on_report_created
  after insert on public.reports
  for each row
  execute function public.handle_report_created_event();

-- B. Comment notification trigger
create or replace function public.handle_new_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  report_owner uuid;
  commenter_name text;
begin
  -- Get the owner of the report
  select user_id into report_owner
  from public.reports
  where id = new.report_id;

  -- Get commenter's name
  select full_name into commenter_name
  from public.profiles
  where id = new.user_id;

  -- Only notify if the commenter is not the owner
  if report_owner != new.user_id then
    insert into public.notifications (user_id, report_id, title, message, type)
    values (
      report_owner,
      new.report_id,
      'New Comment',
      coalesce(commenter_name, 'Someone') || ' commented on your report: "' || left(new.content, 50) || '"',
      'comment'
    );
  end if;

  return new;
end;
$$;

create or replace trigger on_comment_created
  after insert on public.comments
  for each row
  execute function public.handle_new_comment_notification();

-- C. Report updates (Status, Department, timestamps, notifications, and events)
create or replace function public.handle_report_update_events_and_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dep_name text;
  admin_id uuid;
begin
  -- Identify the actor performing the update
  admin_id := auth.uid();

  -- 1. Status change handling
  if old.status is distinct from new.status then
    -- Log timeline event
    insert into public.report_events (report_id, user_id, event_type, from_status, to_status, description)
    values (
      new.id,
      admin_id,
      'status_change',
      old.status,
      new.status,
      'Status changed from ' || old.status || ' to ' || new.status
    );

    -- Notify reporter
    insert into public.notifications (user_id, report_id, title, message, type)
    values (
      new.user_id,
      new.id,
      'Report Status Updated',
      'Your report status has been updated to "' || new.status || '".',
      'status_change'
    );

    -- Timestamps
    if new.status = 'resolved' then
      new.resolved_at := now();
    elsif new.status = 'assigned' then
      new.assigned_at := now();
    end if;
  end if;

  -- 2. Department assignment handling
  if old.department_id is distinct from new.department_id then
    if new.department_id is not null then
      select name into dep_name from public.departments where id = new.department_id;

      -- Log timeline event
      insert into public.report_events (report_id, user_id, event_type, description)
      values (
        new.id,
        admin_id,
        'department_assignment',
        'Assigned to department: ' || dep_name
      );

      -- Notify reporter
      insert into public.notifications (user_id, report_id, title, message, type)
      values (
        new.user_id,
        new.id,
        'Department Assigned',
        'Your report has been assigned to the ' || dep_name || ' department.',
        'department_assignment'
      );

      -- Automatically advance status from pending to assigned if needed
      new.assigned_at := now();
      if new.status = 'pending' then
        new.status := 'assigned';
      end if;
    else
      -- Log timeline unassignment event
      insert into public.report_events (report_id, user_id, event_type, description)
      values (
        new.id,
        admin_id,
        'department_assignment',
        'Removed department assignment'
      );
    end if;
  end if;

  return new;
end;
$$;

create or replace trigger on_report_updated
  before update on public.reports
  for each row
  execute function public.handle_report_update_events_and_notifications();

-- D. Admin notes creation event trigger
create or replace function public.handle_new_admin_note_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.report_events (report_id, user_id, event_type, description)
  values (
    new.report_id,
    new.user_id,
    'admin_note_added',
    'Admin added an internal note.'
  );
  return new;
end;
$$;

create or replace trigger on_admin_note_created
  after insert on public.admin_notes
  for each row
  execute function public.handle_new_admin_note_event();

-- E. Auto-role assignment fallback for testing
create or replace function public.handle_new_user_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Automatically grant admin role to specific email suffixes or first registered user
  if new.email like '%@civiq.gov' or not exists (select 1 from public.profiles where role = 'admin') then
    new.role := 'admin';
  else
    new.role := 'user';
  end if;
  return new;
end;
$$;

-- We modify the trigger on user profile insert to evaluate roles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin_check boolean;
begin
  -- If first user or civiq.gov email, set role as admin
  if new.email like '%@civiq.gov' or not exists (select 1 from public.profiles where role = 'admin') then
    insert into public.profiles (id, email, full_name, avatar_url, role)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'avatar_url',
      'admin'
    );
  else
    insert into public.profiles (id, email, full_name, avatar_url, role)
    values (
      new.id,
      new.email,
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'avatar_url',
      'user'
    );
  end if;

  return new;
end;
$$;
