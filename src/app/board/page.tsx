import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/session";
import { CommentForm } from "@/components/comment-form";
import { LikeButton } from "@/components/like-button";
import type { Comment, Post, Reaction } from "@/types/database";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  general: "일반",
  question: "질문",
  confession: "고백/하소연",
  humor: "잼얘",
  event: "행사/모임",
  suggestion: "건의사항",
};

const categoryOptions = [
  ["all", "전체"],
  ["general", "일반"],
  ["question", "질문"],
  ["confession", "고백/하소연"],
  ["humor", "잼얘"],
  ["event", "행사/모임"],
  ["suggestion", "건의사항"],
] as const;

type BoardData = {
  posts: Post[];
  comments: Comment[];
  reactions: Reaction[];
};

type BoardPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

function normalizeCategoryFilter(category?: string) {
  return category && category in categoryLabels ? category : "all";
}

async function getBoardData(category: string): Promise<BoardData> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { posts: [], comments: [], reactions: [] };
  }

  const supabase = await createClient();
  let postsQuery = supabase
    .from("posts")
    .select("*")
    .eq("status", "published");

  if (category !== "all") {
    postsQuery = postsQuery.eq("category", category);
  }

  const postsResult = await postsQuery
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

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = await searchParams;
  const activeCategory = normalizeCategoryFilter(params?.category);
  const session = await getMemberSession();

  if (!session) {
    redirect("/");
  }

  const { posts, comments, reactions } = await getBoardData(activeCategory);

  return (
    <main className="board-page">
      <section className="board-panel">
        <div className="top-bar">
          <div>
            <h1>대나무숲</h1>
          </div>
          <Link className="ghost-button" href="/">
            종이 쓰러 가기
          </Link>
        </div>

        <nav className="category-filter" aria-label="게시글 분류">
          {categoryOptions.map(([value, label]) => {
            const href = value === "all" ? "/board" : `/board?category=${value}`;
            const selected = activeCategory === value;

            return (
              <Link
                aria-current={selected ? "page" : undefined}
                className={selected ? "category-chip active" : "category-chip"}
                href={href}
                key={value}
              >
                {label}
              </Link>
            );
          })}
        </nav>

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
                    {post.is_pinned && <span className="pinned-badge">공지</span>}
                    <span>{categoryLabels[post.category] ?? post.category}</span>
                    <span>{publicAuthor(post.is_anonymous, post.author_name)}</span>
                    <time>{formatDate(post.published_at ?? post.created_at)}</time>
                  </div>
                  <p>{post.content}</p>

                  <div className="reaction-row">
                    {session ? (
                      <LikeButton
                        count={postReactions.length}
                        key={`${post.id}-${liked}-${postReactions.length}`}
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
                        <span>{postReactions.length}</span>
                      </Link>
                    )}
                    <span>댓글 {postComments.length}</span>
                    <Link className="post-permalink" href={`/post/${post.id}`}>
                      permalink
                    </Link>
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
