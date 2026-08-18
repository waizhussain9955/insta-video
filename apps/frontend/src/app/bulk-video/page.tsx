"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BulkVideoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/bulk");
  }, [router]);

  return null;
}
