# YUMC 대나무숲 — 설계 문서

> 최초 작성: 2026-05-31

---

## 1. 프로젝트 개요

YUMC(동아리) 구성원들이 익명으로 자유롭게 이야기를 나눌 수 있는 커뮤니티 플랫폼.  
과거 유행했던 페이스북 대나무숲 형식을 참고하되, 자체 웹 서비스로 구현한다.

### 핵심 원칙
- **완전 익명**: 작성자 정보를 저장하지 않거나, 추적 불가능한 토큰으로만 식별
- **간결한 UX**: 글 작성 → 관리자 승인 → 게시의 단순한 플로우
- **안전한 공간**: 신고 및 관리자 모더레이션으로 건강한 커뮤니티 유지

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (Route Handlers) |
| DB / Auth | Supabase (PostgreSQL + Supabase Auth) |
| Deployment | Vercel |

---

## 3. 기능 명세

### 3.1 일반 사용자 기능

| 기능 | 설명 |
|------|------|
| 글 목록 조회 | 승인된 글만 최신순으로 표시, 페이지네이션 |
| 글 상세 조회 | 본문 + 댓글 목록 |
| 익명 글 작성 | 내용 + 카테고리 선택, 작성 후 관리자 승인 대기 |
| 익명 댓글 작성 | 승인된 글에 댓글 작성 |
| 반응(Reaction) | 글/댓글에 공감 표시 (좋아요 등) |
| 신고 | 부적절한 글/댓글 신고 |

### 3.2 관리자 기능 (Supabase Auth 인증)

| 기능 | 설명 |
|------|------|
| 글 승인 / 거절 | 대기 중인 글 검토 후 처리 |
| 글 삭제 | 게시된 글 강제 삭제 |
| 댓글 삭제 | 부적절한 댓글 삭제 |
| 신고 처리 | 신고된 항목 확인 및 조치 |
| 공지 작성 | 상단 고정 공지 글 작성 (익명 X) |

---

## 4. DB 스키마 (Supabase / PostgreSQL)

### 4.1 posts

```sql
create table posts (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  category    text not null default 'general',
  status      text not null default 'pending',   -- pending | published | rejected
  is_pinned   boolean not null default false,
  anon_token  text,           -- 같은 작성자 식별용 해시 (복원 불가)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- status: pending(승인대기) / published(게시) / rejected(거절)
```

### 4.2 comments

```sql
create table comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  content     text not null,
  anon_token  text,
  created_at  timestamptz not null default now()
);
```

### 4.3 reactions

```sql
create table reactions (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null,   -- 'post' | 'comment'
  target_id   uuid not null,
  reaction    text not null default 'like',
  anon_token  text not null,
  created_at  timestamptz not null default now(),
  unique (target_type, target_id, anon_token, reaction)
);
```

### 4.4 reports

```sql
create table reports (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null,   -- 'post' | 'comment'
  target_id   uuid not null,
  reason      text not null,
  status      text not null default 'pending',  -- pending | resolved
  created_at  timestamptz not null default now()
);
```

### 4.5 Row Level Security (RLS) 방침

| 테이블 | 일반 사용자 | 관리자 |
|--------|------------|-------|
| posts | SELECT(published만), INSERT | 모든 권한 |
| comments | SELECT, INSERT | 모든 권한 |
| reactions | SELECT, INSERT, DELETE(본인) | 모든 권한 |
| reports | INSERT | 모든 권한 |

---

## 5. 페이지 구조 (App Router)

```
/                       메인 피드 (승인된 글 목록)
/post/[id]             글 상세 + 댓글
/submit                익명 글 작성 폼
/admin                 관리자 대시보드 (인증 필요)
/admin/posts           글 관리 (승인/거절/삭제)
/admin/reports         신고 관리
```

---

## 6. 익명성 구현 방식

- 작성 시 브라우저에서 **랜덤 UUID + 타임스탬프 기반 해시** 생성 → `anon_token`으로 저장
- 서버는 `anon_token`을 그대로 저장하되, **원본 IP나 사용자 정보를 저장하지 않음**
- 같은 세션에서 작성한 글/댓글 여부를 클라이언트 측에서만 표시 가능 (예: "내 글" 배지)
- 관리자도 `anon_token` 외에 작성자를 식별할 수 없음

---

## 7. 카테고리

초기 카테고리 (추후 관리자 설정 가능):
- `general` — 일반
- `question` — 질문
- `confession` — 고백/하소연
- `humor` — 유머
- `event` — 행사/모임

---

## 8. 비기능 요구사항

- 모바일 우선 반응형 디자인
- 최초 로드 시 LCP 2.5초 이내 목표
- Supabase 무료 플랜 기준으로 운영 가능한 구조 유지
