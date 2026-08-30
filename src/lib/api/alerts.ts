/**
 * Alerts API クライアント（STEP 18）。認証済みのときのみ DB のアラートを取得する。
 */

"use client";

import { getToken } from "./auth";
import { apiGet } from "./client";
import { isAuthed } from "./watchlists";

export interface AlertRecord {
  id: number;
  kind: "opportunity" | "season";
  productId?: string | null;
  message?: string | null;
  payload?: Record<string, unknown> | null;
  createdAt: string;
  readAt?: string | null;
}

/** DB のアラートを取得。未認証・失敗時は null（呼び出し側でフォールバック）。 */
export async function fetchAlertRecords(): Promise<AlertRecord[] | null> {
  if (!isAuthed()) return null;
  const token = getToken();
  if (!token) return null;
  try {
    return await apiGet<AlertRecord[]>("/alerts", token);
  } catch {
    return null;
  }
}
