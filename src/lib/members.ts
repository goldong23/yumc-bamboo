import "server-only";

import { createHash } from "crypto";
import memberData from "@/data/member-hashes.json";

const ADMIN_MEMBER_HASH =
  "ce934586f51a36fb0807006c698f392fa29b32198d1d67ebf7cbdccedb703512";

function normalizeName(name: string) {
  return name.replace(/\s+/g, "").trim().toLowerCase();
}

function normalizeStudentId(studentId: string) {
  return studentId.replace(/[^0-9]/g, "");
}

export function hashMemberCredential(name: string, studentId: string) {
  const normalized = `${normalizeName(name)}:${normalizeStudentId(studentId)}`;
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function verifyMember(name: string, studentId: string) {
  const hash = hashMemberCredential(name, studentId);
  return {
    ok: new Set(memberData.hashes).has(hash),
    hash,
    displayName: name.trim(),
  };
}

export function isAdminMemberHash(hash: string) {
  return hash === ADMIN_MEMBER_HASH;
}

export const memberCount = memberData.count;
