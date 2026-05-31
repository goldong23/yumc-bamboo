"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/members";
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

function requireSupabaseEnv() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return "Supabase 환경변수가 아직 설정되지 않았습니다.";
  }
  return "";
}

export async function signInMember(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void prevState;
  const name = textValue(formData, "name");
  const studentId = textValue(formData, "studentId");

  if (!name || !studentId) {
    return { message: "이름과 학번을 모두 입력해 주세요." };
  }

  const result = verifyMember(name, studentId);
  if (!result.ok) {
    return { message: "동아리 명단에서 확인되지 않았습니다." };
  }

  await setMemberSession({
    name: result.displayName,
    memberHash: result.hash,
  });

  revalidatePath("/");
  redirect("/");
}

export async function signOutMember() {
  await clearMemberSession();
  revalidatePath("/");
  redirect("/");
}

export async function submitPost(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void prevState;
  const envError = requireSupabaseEnv();
  if (envError) return { message: envError };

  const session = await getMemberSession();
  if (!session) {
    return { message: "회원 확인 후 글을 던질 수 있습니다." };
  }

  const content = textValue(formData, "content");
  const category = textValue(formData, "category") || "general";
  const visibility = textValue(formData, "visibility") || "anonymous";

  if (content.length < 5) {
    return { message: "본문은 5자 이상 입력해 주세요." };
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
    author_name: isAnonymous ? null : session.name,
  });

  if (error) {
    return { message: `저장에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/");
  redirect("/?submitted=1");
}

export async function signInAdmin(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void prevState;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    return { message: "Vercel 환경변수 ADMIN_PASSWORD를 먼저 설정해 주세요." };
  }

  const password = textValue(formData, "password");
  if (password !== configuredPassword) {
    return { message: "관리자 비밀번호가 맞지 않습니다." };
  }

  await setAdminSession();
  revalidatePath("/admin");
  redirect("/admin");
}

export async function signOutAdmin() {
  await clearAdminSession();
  revalidatePath("/admin");
  redirect("/admin");
}

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session?.admin) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

export async function publishPost(formData: FormData) {
  await requireAdmin();
  const id = textValue(formData, "id");
  const supabase = createAdminClient();

  await supabase
    .from("posts")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function rejectPost(formData: FormData) {
  await requireAdmin();
  const id = textValue(formData, "id");
  const supabase = createAdminClient();

  await supabase.from("posts").update({ status: "rejected" }).eq("id", id);

  revalidatePath("/admin");
}
