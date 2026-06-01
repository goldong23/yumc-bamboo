"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function DeliveryToast() {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setVisible(false), 2600);
    const cleanTimer = window.setTimeout(() => router.replace("/"), 3200);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(cleanTimer);
    };
  }, [router]);

  return (
    <div className={visible ? "delivery-toast" : "delivery-toast hiding"} role="status">
      글이 전달되었습니다. 검수 후 게시됩니다.
    </div>
  );
}
