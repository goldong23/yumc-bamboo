# YUMC 대나무숲 — CLAUDE.md

YUMC 동아리 익명 커뮤니티 프로젝트. 협업 환경을 전제로 한다.

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **Backend / DB**: Supabase (PostgreSQL + RLS)
- **Deployment**: Vercel

## 디렉토리 구조

```
yumc-bamboo/
├── docs/               # 설계 문서, TODO, SQL 마이그레이션 — 협업 문서 전용
│   ├── design.md       # 전체 설계 문서
│   ├── todo.md         # 작업 현황 및 TODO
│   └── migration.sql   # Supabase 초기 스키마
├── src/
│   ├── app/            # Next.js App Router 페이지
│   ├── components/     # 재사용 UI 컴포넌트
│   ├── lib/
│   │   ├── supabase/   # Supabase 클라이언트 (client.ts / server.ts)
│   │   └── anon.ts     # 익명 토큰 유틸
│   └── types/
│       └── database.ts # DB 타입 정의
├── .env.local.example  # 환경변수 템플릿 (커밋 가능)
└── CLAUDE.md
```

## 문서 관리 규칙

- **모든 설계 문서, 결정 사항, TODO는 `docs/` 디렉토리에서 관리한다.**
- 새 기능 설계 시 `docs/design.md`에 섹션을 추가하거나 별도 파일(`docs/feature-xxx.md`)로 분리한다.
- 작업 진행 상황은 `docs/todo.md`에서 추적한다. 완료 항목은 `[x]`로 표시한다.
- DB 스키마 변경 시 `docs/migration.sql`에 변경 내용을 append한다.

## 개발 규칙

### Supabase
- **브라우저용 클라이언트**: `@/lib/supabase/client.ts`의 `createClient()` 사용
- **서버용 클라이언트**: `@/lib/supabase/server.ts`의 `createClient()` 사용
- Server Component와 Route Handler에서는 항상 서버용 클라이언트를 사용한다.

### 익명 토큰
- `@/lib/anon.ts`의 `getAnonToken()`으로 클라이언트 측에서 생성/조회한다.
- 서버에 IP나 사용자 식별 정보를 저장하지 않는다.

### 타입
- DB 타입은 `@/types/database.ts`에서 중앙 관리한다.
- Supabase 클라이언트에 `Database` 제네릭을 반드시 주입한다.

### 코드 스타일
- 컴포넌트: PascalCase, 파일명도 동일
- 유틸/훅: camelCase
- 주석은 WHY가 불명확한 경우에만 작성한다.

## 환경변수 설정

`.env.local.example`을 복사해 `.env.local` 파일 생성 후 Supabase 값 입력:

```bash
cp .env.local.example .env.local
```

| 키 | 설명 |
|----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | service role 키 (서버 전용, 노출 금지) |

## Supabase 초기 세팅 순서

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `docs/migration.sql` 전체 실행
3. `.env.local`에 프로젝트 URL과 키 입력
4. 관리자 계정은 Supabase Authentication > Users에서 직접 생성

## 로컬 개발 실행

```bash
npm run dev
```
