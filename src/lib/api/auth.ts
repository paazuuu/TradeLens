/**
 * 認証クライアント（STEP 19）。バックエンドの /auth/* を呼び、JWT を localStorage に保持する。
 * API 未設定時（NEXT_PUBLIC_API_URL なし）はデモモードとして扱い、呼び出し側で分岐する。
 */

"use client";

import { apiGet, apiPost, isApiEnabled } from "./client";

const TOKEN_KEY = "crossborder_auth_token";

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string | null;
}

interface TokenResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage 不可の環境では保持しない（メモリ内のみ）。
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // no-op
  }
}

export { isApiEnabled };

export async function register(email: string, password: string, displayName?: string): Promise<AuthUser> {
  const res = await apiPost<TokenResponse>("/auth/register", { email, password, displayName });
  setToken(res.accessToken);
  return res.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await apiPost<TokenResponse>("/auth/login", { email, password });
  setToken(res.accessToken);
  return res.user;
}

/** 保持中トークンからユーザーを取得。未ログイン/失効時は null。 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token || !isApiEnabled()) return null;
  try {
    return await apiGet<AuthUser>("/auth/me", token);
  } catch {
    clearToken();
    return null;
  }
}
