create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  image_url text not null,
  category text not null check (category in ('Pothole', 'Garbage', 'Water Leakage', 'Streetlight', 'Traffic', 'Other')),
  severity text not null check (severity in ('Low', 'Medium', 'High')),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  summary text not null,
  status text not null default 'pending',
  latitude double precision not null,
  longitude double precision not null,
  address text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.reports enable row level security;

create policy "Users can read their own reports"
  on public.reports
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own reports"
  on public.reports
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reports"
  on public.reports
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own reports"
  on public.reports
  for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-images',
  'report-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload their own report images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'report-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read report images"
  on storage.objects
  for select
  using (
    bucket_id = 'report-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own report images"
  on storage.objects
  for update
  using (
    bucket_id = 'report-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'report-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own report images"
  on storage.objects
  for delete
  using (
    bucket_id = 'report-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
