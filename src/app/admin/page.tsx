import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishPost, rejectPost, signOutAdmin } from "@/app/actions";
import type { Post } from "@/types/database";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  general: "일반",
  question: "질문",
  confession: "고백/하소연",
  humor: "유머",
  event: "행사/모임",
};

async function getAdminPosts() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      pending: [] as Post[],
      published: [] as Post[],
      error: "Supabase 관리자 환경변수가 필요합니다.",
    };
  }

  const supabase = createAdminClient();
  const [pending, published] = await Promise.all([
    supabase
      .from("posts")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(12),
  ]);

  return {
    pending: pending.data ?? [],
    published: published.data ?? [],
    error: pending.error?.message ?? published.error?.message ?? "",
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AdminPostCard({ post, mode }: { post: Post; mode: "pending" | "published" }) {
  const displayName = post.is_anonymous ? "익명 선택" : `비익명: ${post.author_name ?? "이름 없음"}`;

  return (
    <article className="admin-post-card">
      <div className="post-meta">
        <span>{categoryLabels[post.category] ?? post.category}</span>
        <span>{displayName}</span>
        <time>{formatDate(mode === "pending" ? post.created_at : post.published_at)}</time>
      </div>
      <p>{post.content}</p>
      {mode === "pending" ? (
        <div className="admin-actions">
          <form action={publishPost}>
            <input name="id" type="hidden" value={post.id} />
            <button className="primary-button small" type="submit">
              게시
            </button>
          </form>
          <form action={rejectPost}>
            <input name="id" type="hidden" value={post.id} />
            <button className="danger-button" type="submit">
              거절
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session?.admin) {
    redirect("/");
  }

  const { pending, published, error } = await getAdminPosts();

  return (
    <main className="admin-shell">
      <section className="admin-dashboard">
        <div className="top-bar">
          <div>
            <p className="eyebrow">Moderation</p>
            <h1>관리자 검수</h1>
          </div>
          <div className="admin-nav">
            <Link className="admin-link" href="/">
              사이트로
            </Link>
            <form action={signOutAdmin}>
              <button className="ghost-button" type="submit">
                로그아웃
              </button>
            </form>
          </div>
        </div>

        {error ? <p className="form-message">{error}</p> : null}

        <div className="admin-columns">
          <section>
            <div className="section-heading">
              <p className="eyebrow">Pending</p>
              <h2>검수 대기 {pending.length}</h2>
            </div>
            <div className="admin-list">
              {pending.length ? (
                pending.map((post) => <AdminPostCard key={post.id} mode="pending" post={post} />)
              ) : (
                <div className="empty-state">검수할 글이 없습니다.</div>
              )}
            </div>
          </section>

          <section>
            <div className="section-heading">
              <p className="eyebrow">Published</p>
              <h2>최근 게시글</h2>
            </div>
            <div className="admin-list">
              {published.length ? (
                published.map((post) => (
                  <AdminPostCard key={post.id} mode="published" post={post} />
                ))
              ) : (
                <div className="empty-state">게시된 글이 없습니다.</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
