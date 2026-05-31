-- Run this if you already created the Supabase tables before the
-- anonymous/non-anonymous option was added.

alter table posts add column if not exists is_anonymous boolean not null default true;
alter table posts add column if not exists author_name text;
alter table posts add column if not exists published_at timestamptz;
