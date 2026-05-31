import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/types/database";

export const dynamic = "force-dynamic";

const categoryLabels: Record<string, string> = {
  general: "일반",
  question: "질문",
  confession: "고백/하소연",
  humor: "유머",
  event: "행사/모임",
};

async function getPublishedPosts() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [] as Post[];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(40);

  return data ?? [];
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

export default async function BoardPage() {
  const posts = await getPublishedPosts();

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
            posts.map((post) => (
              <article className="post-card" key={post.id}>
                <div className="post-meta">
                  <span>{categoryLabels[post.category] ?? post.category}</span>
                  <span>{post.is_anonymous ? "익명" : post.author_name ?? "비익명"}</span>
                  <time>{formatDate(post.published_at ?? post.created_at)}</time>
                </div>
                <p>{post.content}</p>
              </article>
            ))
          ) : (
            <div className="empty-state">아직 숲에 걸린 글이 없습니다.</div>
          )}
        </div>
      </section>
    </main>
  );
}
