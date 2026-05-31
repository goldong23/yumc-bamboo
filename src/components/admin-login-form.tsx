"use client";

import { useActionState } from "react";
import { signInAdmin } from "@/app/actions";
import { ActionButton } from "@/components/action-button";

const initialState = { message: "" };

export function AdminLoginForm() {
  const [state, formAction] = useActionState(signInAdmin, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <label>
        <span>관리자 비밀번호</span>
        <input name="password" type="password" required />
      </label>
      {state.message ? <p className="form-message">{state.message}</p> : null}
      <ActionButton className="primary-button" pendingText="확인 중">
        관리자 입장
      </ActionButton>
    </form>
  );
}
