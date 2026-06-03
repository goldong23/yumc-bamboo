"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hashMemberCredential,
  isAdminCredential,
  normalizeStudentId,
  verifyMember,
} from "@/lib/members";
import {
  clearAdminSession,
  clearMemberSession,
  getAdminSession,
  getMemberSession,
  setAdminSession,
  setMemberSession,
} from "@/lib/session";

export type ActionState = {
  message: string;
};

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function publicName(isAnonymous: boolean, name: string) {
  return isAnonymous ? null : name;
}

export async function signInMember(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void prevState;
  const name = textValue(formData, "name");
  const studentId = normalizeStudentId(textValue(formData, "studentId"));

  if (!name || !studentId) {
    return { message: "이름과 학번을 모두 입력해 주세요." };
  }

  if (isAdminCredential(name, studentId)) {
    await setAdminSession();
    await setMemberSession({
      name: "관리자",
      studentId,
      memberHash: hashMemberCredential(name, studentId),
    });

    revalidatePath("/");
    revalidatePath("/board");
    revalidatePath("/admin");
    redirect("/admin");
  }

  const result = verifyMember(name, studentId);
  if (!result.ok) {
    return { message: "동아리 명단에서 확인되지 않았습니다." };
  }

  await clearAdminSession();
  await setMemberSession({
    name: result.displayName,
    studentId,
    memberHash: result.hash,
  });

  revalidatePath("/");
  redirect("/");
}

export async function signOutMember() {
  await clearMemberSession();
  await clearAdminSession();
  revalidatePath("/");
  revalidatePath("/board");
  revalidatePath("/admin");
  redirect("/");
}

export async function submitPost(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void prevState;

  if (!hasSupabaseEnv()) {
    return { message: "아직 게시함이 연결되지 않았습니다. Vercel 환경변수를 확인해 주세요." };
  }

  const session = await getMemberSession();
  if (!session) {
    return { message: "회원 확인 후 글을 던질 수 있습니다." };
  }

  const content = textValue(formData, "content");
  const category = textValue(formData, "category") || "general";
  const visibility = textValue(formData, "visibility") || "anonymous";

  if (content.length < 1) {
    return { message: "본문은 1자 이상 입력해 주세요." };
  }

  if (content.length > 1200) {
    return { message: "본문은 1200자 이하로 입력해 주세요." };
  }

  const isAnonymous = visibility !== "named";
  const supabase = await createClient();
  const { error } = await supabase.from("posts").insert({
    content,
    category,
    status: "pending",
    is_pinned: false,
    anon_token: crypto.randomUUID(),
    is_anonymous: isAnonymous,
    author_name: publicName(isAnonymous, session.name),
    author_student_id: session.studentId ?? null,
  });

  if (error) {
    return { message: `저장에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/board");
  redirect("/?submitted=1");
}

export async function submitComment(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void prevState;

  if (!hasSupabaseEnv()) {
    return { message: "댓글함이 아직 연결되지 않았습니다." };
  }

  const session = await getMemberSession();
  if (!session) {
    return { message: "댓글은 회원 확인 후 작성할 수 있습니다." };
  }

  const postId = textValue(formData, "postId");
  const content = textValue(formData, "content");
  const visibility = textValue(formData, "visibility") || "anonymous";

  if (!postId) {
    return { message: "게시글을 찾을 수 없습니다." };
  }

  if (content.length < 1) {
    return { message: "댓글은 1자 이상 입력해 주세요." };
  }

  if (content.length > 500) {
    return { message: "댓글은 500자 이하로 입력해 주세요." };
  }

  const isAnonymous = visibility !== "named";
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content,
    anon_token: crypto.randomUUID(),
    is_anonymous: isAnonymous,
    author_name: publicName(isAnonymous, session.name),
    author_student_id: session.studentId ?? null,
  });

  if (error) {
    return { message: `댓글 저장에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/board");
  return { message: "" };
}

export async function setPostLike(formData: FormData) {
  if (!hasSupabaseEnv()) return;

  const session = await getMemberSession();
  if (!session) {
    redirect("/");
  }

  const postId = textValue(formData, "postId");
  const shouldLike = textValue(formData, "liked") === "true";
  if (!postId) return;

  const supabase = createAdminClient();
  const existing = await supabase
    .from("reactions")
    .select("id")
    .eq("target_type", "post")
    .eq("target_id", postId)
    .eq("anon_token", session.memberHash)
    .eq("reaction", "like")
    .maybeSingle();

  if (shouldLike && !existing.data?.id) {
    const { error } = await supabase.from("reactions").insert({
      target_type: "post",
      target_id: postId,
      anon_token: session.memberHash,
      reaction: "like",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  if (!shouldLike && existing.data?.id) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.data.id)
      .eq("anon_token", session.memberHash);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { count } = await supabase
    .from("reactions")
    .select("id", { count: "exact", head: true })
    .eq("target_type", "post")
    .eq("target_id", postId)
    .eq("reaction", "like");

  revalidatePath("/board");
  return { count: count ?? 0, liked: shouldLike };
}

export async function signOutAdmin() {
  await clearAdminSession();
  revalidatePath("/");
  revalidatePath("/board");
  revalidatePath("/admin");
  redirect("/");
}

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session?.admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

function redirectAdminError(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

export async function publishPost(formData: FormData) {
  await requireAdmin();
  const id = textValue(formData, "id");
  if (!id) {
    redirectAdminError("게시할 글을 찾을 수 없습니다.");
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirectAdminError(`게시 실패: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/board");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function rejectPost(formData: FormData) {
  await requireAdmin();
  const id = textValue(formData, "id");
  if (!id) {
    redirectAdminError("거절할 글을 찾을 수 없습니다.");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("posts").update({ status: "rejected" }).eq("id", id);

  if (error) {
    redirectAdminError(`거절 실패: ${error.message}`);
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = textValue(formData, "id");
  if (!id) {
    redirectAdminError("삭제할 글을 찾을 수 없습니다.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    redirectAdminError(`삭제 실패: ${error.message}`);
  }

  revalidatePath("/board");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteComment(formData: FormData) {
  await requireAdmin();
  const id = textValue(formData, "id");
  if (!id) {
    redirectAdminError("삭제할 댓글을 찾을 수 없습니다.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) {
    redirectAdminError(`댓글 삭제 실패: ${error.message}`);
  }

  revalidatePath("/board");
  revalidatePath("/admin");
  redirect("/admin");
}
