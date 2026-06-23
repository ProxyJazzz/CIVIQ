-- ============================================================
-- Migration: AI Intelligence Layer
-- Enables: pgvector, similarity matching, and analytics views
-- ============================================================

-- Enable the pgvector extension to store and search machine learning embeddings
create extension if not exists vector;

-- Alter the reports table to add AI enrichment columns
alter table public.reports
  add column if not exists department text,
  add column if not exists tags text[] default '{}'::text[],
  add column if not exists ai_summary text,
  add column if not exists embedding vector(768);

-- Create index on the embedding column using cosine distance for fast semantic lookup
create index if not exists reports_embedding_idx
  on public.reports
  using hnsw (embedding vector_cosine_ops);

-- Create a security-invoking view that exposes reports enriched with calculated trust and trending scores
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

-- Function: match_reports (detects duplicates based on physical distance and semantic embedding similarity)
create or replace function public.match_reports (
  query_embedding vector(768),
  match_threshold float,
  max_distance_meters float,
  input_lat float,
  input_lng float
)
returns table (
  id uuid,
  title text,
  description text,
  image_url text,
  category text,
  severity text,
  status text,
  latitude float,
  longitude float,
  address text,
  distance_meters float,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    r.id,
    r.title,
    r.description,
    r.image_url,
    r.category,
    r.severity,
    r.status,
    r.latitude,
    r.longitude,
    r.address,
    -- Earth distance calculation (clamped to prevent acos domain error)
    (6371000 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(input_lat)) * cos(radians(r.latitude)) *
        cos(radians(r.longitude) - radians(input_lng)) +
        sin(radians(input_lat)) * sin(radians(r.latitude))
      ))
    ))::float as distance_meters,
    (1 - (r.embedding <=> query_embedding))::float as similarity
  from public.reports r
  where
    -- Within specified meters
    (6371000 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(input_lat)) * cos(radians(r.latitude)) *
        cos(radians(r.longitude) - radians(input_lng)) +
        sin(radians(input_lat)) * sin(radians(r.latitude))
      ))
    )) <= max_distance_meters
    -- Similarity above threshold
    and (1 - (r.embedding <=> query_embedding)) >= match_threshold
  order by similarity desc;
end;
$$;

-- Function: search_reports_semantic (performs semantic cosine distance matching for user searches)
create or replace function public.search_reports_semantic (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  description text,
  image_url text,
  category text,
  severity text,
  status text,
  latitude float,
  longitude float,
  address text,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    r.id,
    r.title,
    r.description,
    r.image_url,
    r.category,
    r.severity,
    r.status,
    r.latitude,
    r.longitude,
    r.address,
    (1 - (r.embedding <=> query_embedding))::float as similarity
  from public.reports r
  where (1 - (r.embedding <=> query_embedding)) >= match_threshold
  order by r.embedding <=> query_embedding
  limit match_count;
end;
$$;
