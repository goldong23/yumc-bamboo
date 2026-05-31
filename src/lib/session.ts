import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const MEMBER_COOKIE = "yumc_member";
const ADMIN_COOKIE = "yumc_admin";
const MAX_AGE = 60 * 60 * 24 * 30;

export type MemberSession = {
  name: string;
  memberHash: string;
};

function sessionSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-only-yumc-bamboo-secret"
  );
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function encode(value: unknown) {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode<T>(raw?: string): T | null {
  if (!raw) return null;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function getMemberSession() {
  const cookieStore = await cookies();
  return decode<MemberSession>(cookieStore.get(MEMBER_COOKIE)?.value);
}

export async function setMemberSession(session: MemberSession) {
  const cookieStore = await cookies();
  cookieStore.set(MEMBER_COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearMemberSession() {
  const cookieStore = await cookies();
  cookieStore.delete(MEMBER_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return decode<{ admin: true }>(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, encode({ admin: true }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
