import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/session";
import { togglePostLike } from "@/app/actions";
import { CommentForm } from "@/components/comment-form";
import type { Comment, Post, Reaction } from "@/types/database";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  general: "일반",
  question: "질문",
  confession: "고백/하소연",
  humor: "유머",
  event: "행사/모임",
};

type BoardData = {
  posts: Post[];
  comments: Comment[];
  reactions: Reaction[];
};

async function getBoardData(): Promise<BoardData> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { posts: [], comments: [], reactions: [] };
  }

  const supabase = await createClient();
  const postsResult = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(40);

  const posts = postsResult.data ?? [];
  if (!posts.length) return { posts, comments: [], reactions: [] };

  const postIds = posts.map((post) => post.id);
  const [commentsResult, reactionsResult] = await Promise.all([
    supabase
      .from("comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("reactions")
      .select("*")
      .eq("target_type", "post")
      .in("target_id", postIds),
  ]);

  return {
    posts,
    comments: commentsResult.data ?? [],
    reactions: reactionsResult.data ?? [],
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

function publicAuthor(isAnonymous: boolean, authorName: string | null) {
  return isAnonymous ? "익명" : authorName ?? "비익명";
}

export default async function BoardPage() {
  const session = await getMemberSession();
  const { posts, comments, reactions } = await getBoardData();

  return (
    <main className="board-page">
      <section className="board-panel">
        <div className="top-bar">
          <div>
            <p className="eyebrow">Published</p>
            <h1>숲에 걸린 글</h1>
          </div>
          <Link className="ghost-button" href="/">
            종이 쓰러 가기
          </Link>
        </div>

        <div className="post-list board-list">
          {posts.length ? (
            posts.map((post) => {
              const postComments = comments.filter((comment) => comment.post_id === post.id);
              const postReactions = reactions.filter((reaction) => reaction.target_id === post.id);
              const liked = session
                ? postReactions.some((reaction) => reaction.anon_token === session.memberHash)
                : false;

              return (
                <article className="post-card board-card" key={post.id}>
                  <div className="post-meta">
                    <span>{categoryLabels[post.category] ?? post.category}</span>
                    <span>{publicAuthor(post.is_anonymous, post.author_name)}</span>
                    <time>{formatDate(post.published_at ?? post.created_at)}</time>
                  </div>
                  <p>{post.content}</p>

                  <div className="reaction-row">
                    {session ? (
                      <form action={togglePostLike}>
                        <input name="postId" type="hidden" value={post.id} />
                        <button className={liked ? "like-button liked" : "like-button"} type="submit">
                          좋아요 {postReactions.length}
                        </button>
                      </form>
                    ) : (
                      <span className="like-count">좋아요 {postReactions.length}</span>
                    )}
                    <span>댓글 {postComments.length}</span>
                  </div>

                  <div className="comment-list">
                    {postComments.map((comment) => (
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
              );
            })
          ) : (
            <div className="empty-state">아직 숲에 걸린 글이 없습니다.</div>
          )}
        </div>
      </section>
    </main>
  );
}
