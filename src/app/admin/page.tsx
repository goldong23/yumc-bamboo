import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminCredential } from "@/lib/members";
import { getAdminSession, getMemberSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteComment,
  publishPost,
  rejectPost,
  signOutAdmin,
} from "@/app/actions";
import { ActionButton } from "@/components/action-button";
import { ConfirmDeletePost } from "@/components/confirm-delete-post";
import type { Comment, Post } from "@/types/database";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  general: "일반",
  question: "질문",
  confession: "고백/하소연",
  humor: "유머",
  event: "행사/모임",
};

type AdminData = {
  pending: Post[];
  published: Post[];
  comments: Comment[];
  setupNeeded: boolean;
  error?: string;
};

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

async function getAdminPosts(): Promise<AdminData> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      pending: [],
      published: [],
      comments: [],
      setupNeeded: true,
    };
  }

  const supabase = createAdminClient();
  const [pending, published, comments] = await Promise.all([
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
      .limit(20),
    supabase.from("comments").select("*").order("created_at", { ascending: true }),
  ]);

  return {
    pending: pending.data ?? [],
    published: published.data ?? [],
    comments: comments.data ?? [],
    setupNeeded: false,
    error: pending.error?.message ?? published.error?.message ?? comments.error?.message ?? "",
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function identityLine(post: Post) {
  const visibility = post.is_anonymous ? "익명 선택" : `비익명: ${post.author_name ?? "이름 없음"}`;
  return `${visibility} / 학번 ${post.author_student_id ?? "기록 없음"}`;
}

function commentIdentity(comment: Comment) {
  const visibility = comment.is_anonymous
    ? "익명"
    : `비익명: ${comment.author_name ?? "이름 없음"}`;
  return `${visibility} / 학번 ${comment.author_student_id ?? "기록 없음"}`;
}

function AdminPostCard({
  post,
  comments,
  mode,
}: {
  post: Post;
  comments: Comment[];
  mode: "pending" | "published";
}) {
  return (
    <article className="admin-post-card">
      <div className="post-meta">
        <span>{categoryLabels[post.category] ?? post.category}</span>
        <span>{identityLine(post)}</span>
        <time>{formatDate(mode === "pending" ? post.created_at : post.published_at)}</time>
      </div>

      <p>{post.content}</p>

      <div className="admin-actions">
        {mode === "pending" ? (
          <>
            <form action={publishPost}>
              <input name="id" type="hidden" value={post.id} />
              <ActionButton className="primary-button small" pendingText="게시 중">
                게시
              </ActionButton>
            </form>
            <form action={rejectPost}>
              <input name="id" type="hidden" value={post.id} />
              <ActionButton className="danger-button" pendingText="거절 중">
                거절
              </ActionButton>
            </form>
          </>
        ) : null}
        {mode === "published" ? <ConfirmDeletePost postId={post.id} /> : null}
      </div>

      {comments.length ? (
        <div className="admin-comment-list">
          <p className="admin-subheading">댓글</p>
          {comments.map((comment) => (
            <div className="admin-comment-item" key={comment.id}>
              <div>
                <p>{comment.content}</p>
                <span>{commentIdentity(comment)}</span>
              </div>
              <form action={deleteComment}>
                <input name="id" type="hidden" value={comment.id} />
                <ActionButton className="danger-button" pendingText="삭제 중">
                  삭제
                </ActionButton>
              </form>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getAdminSession();
  const memberSession = await getMemberSession();

  if (
    !session?.admin ||
    !memberSession ||
    !isAdminCredential(memberSession.name, memberSession.studentId)
  ) {
    redirect("/");
  }

  const params = await searchParams;
  const { pending, published, comments, setupNeeded, error } = await getAdminPosts();
  const actionError = params?.error ? decodeURIComponent(params.error) : "";

  return (
    <main className="admin-shell">
      <section className="admin-dashboard">
        <div className="top-bar">
          <div>
            <p className="eyebrow">Moderation</p>
            <h1>관리자 검수</h1>
          </div>
          <div className="admin-nav">
            <Link className="admin-link" href="/board">
              게시판
            </Link>
            <Link className="admin-link" href="/">
              글쓰기
            </Link>
            <form action={signOutAdmin}>
              <button className="ghost-button" type="submit">
                로그아웃
              </button>
            </form>
          </div>
        </div>

        {setupNeeded ? (
          <p className="setup-note">
            검수함을 불러오려면 Vercel 환경변수에 Supabase URL, anon key, service role key를
            등록해야 합니다.
          </p>
        ) : null}
        {error || actionError ? <p className="form-message">{actionError || error}</p> : null}

        <div className="admin-columns">
          <section>
            <div className="section-heading">
              <p className="eyebrow">Pending</p>
              <h2>검수 대기 {pending.length}</h2>
            </div>
            <div className="admin-list">
              {pending.length ? (
                pending.map((post) => (
                  <AdminPostCard
                    comments={comments.filter((comment) => comment.post_id === post.id)}
                    key={post.id}
                    mode="pending"
                    post={post}
                  />
                ))
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
                  <AdminPostCard
                    comments={comments.filter((comment) => comment.post_id === post.id)}
                    key={post.id}
                    mode="published"
                    post={post}
                  />
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
