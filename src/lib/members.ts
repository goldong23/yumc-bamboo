import "server-only";

import { createHash } from "crypto";
import memberData from "@/data/member-hashes.json";

const ADMIN_NAME = "관리자";
const ADMIN_STUDENT_ID = "09233333";

function normalizeName(name: string) {
  return name.replace(/\s+/g, "").trim().toLowerCase();
}

export function normalizeStudentId(studentId: string) {
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

export function isAdminCredential(name: string, studentId: string) {
  return (
    normalizeName(name) === normalizeName(ADMIN_NAME) &&
    normalizeStudentId(studentId) === ADMIN_STUDENT_ID
  );
}

export const memberCount = memberData.count;
