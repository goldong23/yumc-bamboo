import Link from "next/link";
import { getMemberSession } from "@/lib/session";
import { signOutMember } from "@/app/actions";
import { MemberLoginForm } from "@/components/member-login-form";
import { PostThrowForm } from "@/components/post-throw-form";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ submitted?: string }>;
}) {
  const params = await searchParams;
  const session = await getMemberSession();

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
            <Link className="secondary-link" href="/board">
              게시판으로 가기
            </Link>
          </div>
        ) : (
          <section className="writer-panel">
            <div className="writer-head">
              <div>
                <p className="eyebrow">입장 완료</p>
                <h2>{session.name} 님의 종이</h2>
              </div>
              <div className="writer-actions">
                <Link className="ghost-button" href="/board">
                  게시판으로 가기
                </Link>
                <form action={signOutMember}>
                  <button className="ghost-button" type="submit">
                    나가기
                  </button>
                </form>
              </div>
            </div>
            <PostThrowForm />
          </section>
        )}
      </section>
    </main>
  );
}
