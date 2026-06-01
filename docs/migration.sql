-- YUMC 대나무숲 DB 스키마
-- Supabase SQL Editor에서 실행합니다.
-- 여러 번 실행해도 기존 객체 충돌이 나지 않도록 작성했습니다.

-- ============================================================
-- 1. posts
-- ============================================================
create table if not exists posts (
  id                 uuid primary key default gen_random_uuid(),
  content            text not null,
  category           text not null default 'general',
  status             text not null default 'pending'
                       check (status in ('pending', 'published', 'rejected')),
  is_pinned          boolean not null default false,
  is_anonymous       boolean not null default true,
  author_name        text,
  author_student_id  text,
  anon_token         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  published_at       timestamptz
);

alter table posts add column if not exists is_anonymous boolean not null default true;
alter table posts add column if not exists author_name text;
alter table posts add column if not exists author_student_id text;
alter table posts add column if not exists published_at timestamptz;

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_updated_at on posts;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- ============================================================
-- 2. comments
-- ============================================================
create table if not exists comments (
  id                 uuid primary key default gen_random_uuid(),
  post_id            uuid not null references posts(id) on delete cascade,
  content            text not null,
  is_anonymous       boolean not null default true,
  author_name        text,
  author_student_id  text,
  anon_token         text,
  created_at         timestamptz not null default now()
);

alter table comments add column if not exists is_anonymous boolean not null default true;
alter table comments add column if not exists author_name text;
alter table comments add column if not exists author_student_id text;

-- ============================================================
-- 3. reactions
-- ============================================================
create table if not exists reactions (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null check (target_type in ('post', 'comment')),
  target_id    uuid not null,
  reaction     text not null default 'like',
  anon_token   text not null,
  created_at   timestamptz not null default now(),
  unique (target_type, target_id, anon_token, reaction)
);

-- ============================================================
-- 4. reports
-- ============================================================
create table if not exists reports (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null check (target_type in ('post', 'comment')),
  target_id    uuid not null,
  reason       text not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'resolved')),
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 5. RLS 활성화
-- ============================================================
alter table posts     enable row level security;
alter table comments  enable row level security;
alter table reactions enable row level security;
alter table reports   enable row level security;

-- ============================================================
-- 6. RLS 정책
-- ============================================================
drop policy if exists "posts_select_published" on posts;
drop policy if exists "posts_insert_anon" on posts;
drop policy if exists "comments_select_published_post" on comments;
drop policy if exists "comments_select_all" on comments;
drop policy if exists "comments_insert_anon" on comments;
drop policy if exists "reactions_select_all" on reactions;
drop policy if exists "reactions_insert_anon" on reactions;
drop policy if exists "reactions_delete_own" on reactions;
drop policy if exists "reports_insert_anon" on reports;

-- posts: 누구나 published 글 조회, 누구나 INSERT(pending)
create policy "posts_select_published"
  on posts for select
  using (status = 'published');

create policy "posts_insert_anon"
  on posts for insert
  with check (status = 'pending');

-- comments: published 게시글의 댓글만 공개 조회, 회원은 작성 가능
create policy "comments_select_published_post"
  on comments for select
  using (
    exists (
      select 1 from posts
      where posts.id = comments.post_id
        and posts.status = 'published'
    )
  );

create policy "comments_insert_anon"
  on comments for insert
  with check (true);

-- reactions: 누구나 조회/작성/삭제
create policy "reactions_select_all"
  on reactions for select
  using (true);

create policy "reactions_insert_anon"
  on reactions for insert
  with check (true);

create policy "reactions_delete_own"
  on reactions for delete
  using (true);

-- reports: 누구나 신고 가능
create policy "reports_insert_anon"
  on reports for insert
  with check (true);

-- ============================================================
-- 7. 인덱스
-- ============================================================
create index if not exists posts_status_created_at on posts (status, created_at desc);
create index if not exists comments_post_id on comments (post_id);
create index if not exists reactions_target on reactions (target_type, target_id);
create index if not exists reports_status on reports (status);

notify pgrst, 'reload schema';
