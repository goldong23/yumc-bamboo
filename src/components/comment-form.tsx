"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitComment } from "@/app/actions";
import { ActionButton } from "@/components/action-button";

const initialState = { message: "" };

export function CommentForm({ postId }: { postId: string }) {
  const [state, formAction] = useActionState(submitComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message === "success") {
      formRef.current?.reset();
    }
  }, [state.message]);

  return (
    <form action={formAction} className="comment-form" ref={formRef}>
      <input name="postId" type="hidden" value={postId} />
      <textarea
        maxLength={500}
        minLength={1}
        name="content"
        placeholder="댓글을 남겨보세요."
        required
        rows={3}
      />
      <div className="comment-form-row">
        <label className="mini-radio">
          <input defaultChecked name="visibility" type="radio" value="anonymous" />
          <span>익명</span>
        </label>
        <label className="mini-radio">
          <input name="visibility" type="radio" value="named" />
          <span>비익명</span>
        </label>
        <ActionButton className="primary-button small" pendingText="작성 중">
          댓글 작성
        </ActionButton>
      </div>
      {state.message === "success" ? (
        <p className="form-success">댓글이 등록되었습니다.</p>
      ) : state.message ? (
        <p className="form-message">{state.message}</p>
      ) : null}
    </form>
  );
}
