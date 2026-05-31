"use client";

import { useActionState, useEffect, useState } from "react";
import { submitPost } from "@/app/actions";
import { ActionButton } from "@/components/action-button";

const initialState = { message: "" };

export function PostThrowForm() {
  const [state, formAction] = useActionState(submitPost, initialState);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!launching) return;
    const timeout = window.setTimeout(() => setLaunching(false), 1300);
    return () => window.clearTimeout(timeout);
  }, [launching]);

  return (
    <div className={launching ? "paper-desk throwing" : "paper-desk"}>
      <form
        action={formAction}
        className="paper-form"
        onSubmit={() => setLaunching(true)}
      >
        <div className="paper-top">
          <label>
            <span>분류</span>
            <select name="category" defaultValue="general">
              <option value="general">일반</option>
              <option value="question">질문</option>
              <option value="confession">고백/하소연</option>
              <option value="humor">유머</option>
              <option value="event">행사/모임</option>
            </select>
          </label>

          <fieldset>
            <legend>표시 방식</legend>
            <label className="radio-card">
              <input defaultChecked name="visibility" type="radio" value="anonymous" />
              <span>익명</span>
            </label>
            <label className="radio-card">
              <input name="visibility" type="radio" value="named" />
              <span>비익명</span>
            </label>
          </fieldset>
        </div>

        <label className="paper-body">
          <span>종이에 남길 말</span>
          <textarea
            maxLength={1200}
            minLength={5}
            name="content"
            placeholder="여기에 적은 글은 관리자 검수 후 대나무숲에 올라갑니다."
            required
            rows={11}
          />
        </label>

        {state.message ? <p className="form-message">{state.message}</p> : null}

        <ActionButton className="throw-button" pendingText="던지는 중">
          구겨서 던지기
        </ActionButton>
      </form>
    </div>
  );
}
