"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePostLike } from "@/app/actions";

type LikeButtonProps = {
  count: number;
  liked: boolean;
  postId: string;
};

export function LikeButton({ count, liked, postId }: LikeButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState({ count, liked });

  function handleClick() {
    if (pending) return;

    const previous = state;
    const next = {
      count: state.liked ? Math.max(0, state.count - 1) : state.count + 1,
      liked: !state.liked,
    };

    setState(next);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", postId);

      try {
        const result = await togglePostLike(formData);

        if (result) {
          setState(result);
        }

        router.refresh();
      } catch {
        setState(previous);
        router.refresh();
      }
    });
  }

  return (
    <button
      aria-label={state.liked ? "좋아요 취소" : "좋아요"}
      className={state.liked ? "like-button liked" : "like-button"}
      disabled={pending}
      onClick={handleClick}
      type="button"
    >
      <span aria-hidden="true">👍</span>
      <span>{state.count}</span>
    </button>
  );
}
