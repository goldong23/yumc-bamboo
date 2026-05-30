# YUMC 대나무숲 — TODO / 작업 현황

> 마지막 업데이트: 2026-05-31

---

## Phase 0 — 개발환경 세팅 ✅

- [x] 프로젝트 설계 문서 작성 (`docs/design.md`)
- [x] Next.js + TypeScript + Tailwind CSS 프로젝트 초기화
- [x] CLAUDE.md 작성
- [ ] Supabase 프로젝트 생성 및 `.env.local` 설정
- [ ] Supabase DB 스키마 적용 (마이그레이션 SQL 실행)
- [ ] RLS 정책 설정

---

## Phase 1 — 기본 CRUD

- [ ] 글 목록 페이지 (`/`) — 승인된 글 카드 목록
- [ ] 글 상세 페이지 (`/post/[id]`) — 본문 + 댓글
- [ ] 글 작성 폼 (`/submit`) — 익명 글 제출
- [ ] 댓글 작성 기능
- [ ] Supabase API 연동 (Server Actions 또는 Route Handlers)

---

## Phase 2 — 반응 & 신고

- [ ] 공감(반응) 기능 — 글/댓글
- [ ] 신고 기능 — 글/댓글
- [ ] 중복 공감 방지 (anon_token 기반)

---

## Phase 3 — 관리자 패널

- [ ] Supabase Auth 관리자 계정 설정
- [ ] 관리자 로그인 페이지
- [ ] 글 승인/거절 UI (`/admin/posts`)
- [ ] 신고 처리 UI (`/admin/reports`)
- [ ] 관리자 미들웨어 (인증 보호)

---

## Phase 4 — 마감 & 배포

- [ ] Vercel 배포 설정
- [ ] 환경변수 Vercel에 등록
- [ ] 도메인 연결 (필요 시)
- [ ] 기본 SEO 메타태그 설정
- [ ] OG 이미지 설정

---

## 백로그 (우선순위 낮음)

- [ ] 카테고리 필터링
- [ ] 검색 기능
- [ ] 공지 고정 글 기능
- [ ] 다크모드
- [ ] 글 작성 후 내 글 추적 (로컬스토리지)
