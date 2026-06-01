"use client";

import { useOptimistic, useTransition } from "react";
import { togglePostLike } from "@/app/actions";

type LikeButtonProps = {
  count: number;
  liked: boolean;
  postId: string;
};

export function LikeButton({ count, liked, postId }: LikeButtonProps) {
  const [pending, startTransition] = useTransition();
  const [optimistic, toggleOptimistic] = useOptimistic(
    { count, liked },
    (state, action: "toggle") => {
      void action;
      return {
        count: state.liked ? Math.max(0, state.count - 1) : state.count + 1,
        liked: !state.liked,
      };
    }
  );

  function handleClick() {
    startTransition(async () => {
      toggleOptimistic("toggle");

      const formData = new FormData();
      formData.set("postId", postId);
      await togglePostLike(formData);
    });
  }

  return (
    <button
      aria-label={optimistic.liked ? "좋아요 취소" : "좋아요"}
      className={optimistic.liked ? "like-button liked" : "like-button"}
      disabled={pending}
      onClick={handleClick}
      type="button"
    >
      <span aria-hidden="true">👍</span>
      <span>{optimistic.count}</span>
    </button>
  );
}
