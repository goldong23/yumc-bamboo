import { createClient } from "@/lib/supabase/server";
import { getMemberSession } from "@/lib/session";
import { signOutMember } from "@/app/actions";
import { MemberLoginForm } from "@/components/member-login-form";
import { PostThrowForm } from "@/components/post-throw-form";
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
    return { posts: [] as Post[], error: "Supabase 환경변수가 필요합니다." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(20);

  return { posts: data ?? [], error: error?.message ?? "" };
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

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ submitted?: string }>;
}) {
  const params = await searchParams;
  const session = await getMemberSession();
  const { posts, error } = await getPublishedPosts();

  return (
    <main className="bamboo-page">
      <section className="hero-scene">
        <div className="brand-lockup">
          <p>YUMC Bamboo Forest</p>
          <h1>대나무숲</h1>
        </div>

        {params?.submitted ? (
          <div className="toast">종이가 숲 너머로 날아갔습니다. 검수 후 게시됩니다.</div>
        ) : null}

        {!session ? (
          <div className="login-card">
            <p className="eyebrow">회원 확인</p>
            <h2>이름과 학번을 적고 숲으로 들어오세요.</h2>
            <MemberLoginForm />
          </div>
        ) : (
          <div className="writing-layout">
            <section className="writer-panel">
              <div className="writer-head">
                <div>
                  <p className="eyebrow">입장 완료</p>
                  <h2>{session.name} 님의 종이</h2>
                </div>
                <form action={signOutMember}>
                  <button className="ghost-button" type="submit">
                    나가기
                  </button>
                </form>
              </div>
              <PostThrowForm />
            </section>

            <aside className="forest-feed">
              <div className="section-heading">
                <p className="eyebrow">검수 완료</p>
                <h2>숲에 걸린 글</h2>
              </div>

              {error ? <p className="form-message">{error}</p> : null}

              <div className="post-list">
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
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
