"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { authRequired, getToken, isApiEnabled } from "@/lib/api/auth";

/**
 * ルート保護（STEP 19）。NEXT_PUBLIC_REQUIRE_AUTH=true かつ API 有効かつ未ログインのとき
 * ログイン画面へリダイレクトする。既定（未設定）やバックエンド無しのデモでは素通しする。
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = React.useState(!authRequired());

  React.useEffect(() => {
    if (!authRequired() || !isApiEnabled() || getToken()) {
      setAllowed(true);
      return;
    }
    router.replace("/auth/v1/login");
  }, [router]);

  if (!allowed) return null;
  return <>{children}</>;
}
