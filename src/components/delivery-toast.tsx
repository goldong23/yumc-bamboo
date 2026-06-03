"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function DeliveryToast() {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
    const hideTimer = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(hideTimer);
  }, [router]);

  return (
    <div className={visible ? "delivery-toast" : "delivery-toast hiding"} role="status">
      글이 전달되었습니다. 검수 후 게시됩니다.
    </div>
  );
}
