"use client";

import { useActionState } from "react";
import { signInMember } from "@/app/actions";
import { ActionButton } from "@/components/action-button";

const initialState = { message: "" };

export function MemberLoginForm() {
  const [state, formAction] = useActionState(signInMember, initialState);

  return (
    <form action={formAction} className="member-form">
      <label>
        <span>이름</span>
        <input autoComplete="name" name="name" placeholder="홍길동" required />
      </label>
      <label>
        <span>학번</span>
        <input
          autoComplete="off"
          inputMode="numeric"
          name="studentId"
          placeholder="20240000"
          required
        />
      </label>
      {state.message ? <p className="form-message">{state.message}</p> : null}
      <ActionButton className="primary-button" pendingText="확인 중">
        숲으로 들어가기
      </ActionButton>
    </form>
  );
}
