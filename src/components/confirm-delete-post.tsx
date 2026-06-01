"use client";

import { useState } from "react";
import { deletePost } from "@/app/actions";
import { ActionButton } from "@/components/action-button";

export function ConfirmDeletePost({ postId }: { postId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button className="danger-button" onClick={() => setConfirming(true)} type="button">
        글 삭제
      </button>
    );
  }

  return (
    <div className="delete-confirm">
      <span>삭제하시겠습니까?</span>
      <form action={deletePost}>
        <input name="id" type="hidden" value={postId} />
        <ActionButton className="danger-button" pendingText="삭제 중">
          예
        </ActionButton>
      </form>
      <button className="ghost-button compact" onClick={() => setConfirming(false)} type="button">
        아니오
      </button>
    </div>
  );
}
