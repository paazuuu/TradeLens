/**
 * Settings API クライアント（UI-012）。グローバル設定を DB と同期する。
 * 認証済みのときのみ書き込み可能。読み取りは誰でも可。
 */

"use client";

import { getToken } from "./auth";
import { API_BASE_URL, apiGet } from "./client";

export interface SettingsPayload {
  exchangeRate: number;
  intlShipping: number;
  domesticShipping: number;
  importTaxRate: number;
  platformFeeRate: number;
  minMargin: number;
  minScore: number;
}

export function settingsApiEnabled(): boolean {
  return Boolean(API_BASE_URL);
}

/** グローバル設定を取得。API 無効・失敗時は null。 */
export async function getSettings(): Promise<SettingsPayload | null> {
  if (!settingsApiEnabled()) return null;
  try {
    return await apiGet<SettingsPayload>("/settings");
  } catch {
    return null;
  }
}

/** グローバル設定を保存（要認証）。成功時 true。 */
export async function putSettings(payload: SettingsPayload): Promise<boolean> {
  const token = getToken();
  if (!settingsApiEnabled() || !token) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
