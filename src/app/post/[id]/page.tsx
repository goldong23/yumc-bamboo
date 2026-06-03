import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/session";
import { CommentForm } from "@/components/comment-form";
import { LikeButton } from "@/components/like-button";
import type { Comment, Reaction } from "@/types/database";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  general: "일반",
  question: "질문",
  confession: "고백/하소연",
  humor: "잼얘",
  event: "행사/모임",
  suggestion: "건의사항",
};

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

function publicAuthor(isAnonymous: boolean, authorName: string | null) {
  return isAnonymous ? "익명" : authorName ?? "비익명";
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    notFound();
  }

  const supabase = await createClient();
  const [postResult, commentsResult, reactionsResult, session] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).eq("status", "published").maybeSingle(),
    supabase.from("comments").select("*").eq("post_id", id).order("created_at", { ascending: true }),
    supabase.from("reactions").select("*").eq("target_type", "post").eq("target_id", id),
    getMemberSession(),
  ]);

  const post = postResult.data;
  if (!post) notFound();

  const comments: Comment[] = commentsResult.data ?? [];
  const reactions: Reaction[] = reactionsResult.data ?? [];
  const liked = session
    ? reactions.some((r) => r.anon_token === session.memberHash)
    : false;

  return (
    <main className="board-page">
      <section className="board-panel">
        <div className="top-bar">
          <div>
            <p className="eyebrow">글 보기</p>
            <h1>대나무숲</h1>
          </div>
          <Link className="ghost-button" href="/board">
            게시판으로
          </Link>
        </div>

        <article className="post-card board-card detail-card">
          <div className="post-meta">
            {post.is_pinned && <span className="pinned-badge">공지</span>}
            <span>{categoryLabels[post.category] ?? post.category}</span>
            <span>{publicAuthor(post.is_anonymous, post.author_name)}</span>
            <time>{formatDate(post.published_at ?? post.created_at)}</time>
          </div>

          <p>{post.content}</p>

          <div className="reaction-row">
            {session ? (
              <LikeButton
                count={reactions.length}
                key={`${post.id}-${liked}-${reactions.length}`}
                liked={liked}
                postId={post.id}
              />
            ) : (
              <Link
                className="like-count"
                href="/"
                title="좋아요는 회원 확인 후 이용 가능합니다"
              >
                <span aria-hidden="true">👍</span>
                <span>{reactions.length}</span>
              </Link>
            )}
            <span>댓글 {comments.length}</span>
          </div>

          <div className="comment-list">
            {comments.map((comment) => (
              <div className="comment-item" key={comment.id}>
                <div className="comment-meta">
                  <span>{publicAuthor(comment.is_anonymous, comment.author_name)}</span>
                  <time>{formatDate(comment.created_at)}</time>
                </div>
                <p>{comment.content}</p>
              </div>
            ))}
          </div>

          {session ? (
            <CommentForm postId={post.id} />
          ) : (
            <p className="comment-login-note">댓글과 좋아요는 회원 확인 후 사용할 수 있습니다.</p>
          )}
        </article>
      </section>
    </main>
  );
}
