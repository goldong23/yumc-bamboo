"use client";

import { useFormStatus } from "react-dom";

type ActionButtonProps = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
};

export function ActionButton({
  children,
  className,
  pendingText = "처리 중",
}: ActionButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingText : children}
    </button>
  );
}
