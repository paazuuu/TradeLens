/**
 * Watchlist API クライアント（STEP 16）。認証済みのときのみ利用する。
 */

"use client";

import { getToken } from "./auth";
import { API_BASE_URL, apiGet, apiPost } from "./client";

export interface WatchlistItem {
  id: number;
  kind: "category" | "product";
  value: string;
  monitorFrequency: string;
}

export async function listWatchlists(token: string): Promise<WatchlistItem[]> {
  return apiGet<WatchlistItem[]>("/watchlists", token);
}

export async function addWatchlist(token: string, kind: "category" | "product", value: string): Promise<WatchlistItem> {
  return apiPost<WatchlistItem>("/watchlists", { kind, value }, token);
}

export async function removeWatchlist(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/watchlists/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`DELETE /watchlists/${id} -> ${res.status}`);
  }
}

/** 認証済み（API 有効かつトークン保持）か。 */
export function isAuthed(): boolean {
  return Boolean(API_BASE_URL) && getToken() !== null;
}
