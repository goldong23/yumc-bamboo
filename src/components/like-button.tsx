"use client";

import { useRef, useState, useTransition } from "react";
import { setPostLike } from "@/app/actions";

type LikeButtonProps = {
  count: number;
  liked: boolean;
  postId: string;
};

export function LikeButton({ count, liked, postId }: LikeButtonProps) {
  const [, startTransition] = useTransition();
  const [state, setState] = useState({ count, liked });
  const stateRef = useRef(state);
  const requestRef = useRef(0);

  function applyState(next: { count: number; liked: boolean }) {
    stateRef.current = next;
    setState(next);
  }

  function handleClick() {
    const previous = stateRef.current;
    const next = {
      count: previous.liked ? Math.max(0, previous.count - 1) : previous.count + 1,
      liked: !previous.liked,
    };
    const requestId = requestRef.current + 1;

    requestRef.current = requestId;
    applyState(next);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", postId);
      formData.set("liked", String(next.liked));

      try {
        const result = await setPostLike(formData);

        if (result && requestRef.current === requestId) {
          applyState(result);
        }
      } catch {
        if (requestRef.current === requestId) {
          applyState(previous);
        }
      }
    });
  }

  return (
    <button
      aria-label={state.liked ? "좋아요 취소" : "좋아요"}
      className={state.liked ? "like-button liked" : "like-button"}
      onClick={handleClick}
      type="button"
    >
      <span aria-hidden="true">👍</span>
      <span>{state.count}</span>
    </button>
  );
}
