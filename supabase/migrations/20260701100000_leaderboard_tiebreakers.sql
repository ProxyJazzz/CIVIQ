-- Redefine user_leaderboard view with the correct sorting order:
-- 1. Sort by Highest Score Descending
-- 2. Sort by Highest Reports count Descending
-- 3. Sort by Highest Verifications count Descending
-- 4. Sort by Alphabetical Display Name Ascending
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
order by score desc, reports_count desc, verifications_count desc, p.full_name asc;
