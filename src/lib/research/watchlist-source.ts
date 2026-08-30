/**
 * Watchlist のデータアクセス（STEP 16）。
 * 認証済み（API 有効かつトークン保持）なら DB(API)、そうでなければ localStorage を使う。
 */

"use client";

import { getToken } from "@/lib/api/auth";
import { addWatchlist, isAuthed, listWatchlists, removeWatchlist } from "@/lib/api/watchlists";
import { getLocalStorageValue, setLocalStorageValue } from "@/lib/local-storage.client";

export type WatchKind = "category" | "product";

export interface WatchItem {
  /** 削除用の一意キー。API は id 文字列、localStorage は value。 */
  key: string;
  kind: WatchKind;
  value: string;
}

const CATEGORIES_KEY = "crossborder_watch_categories";
const PRODUCTS_KEY = "crossborder_watch_products";

function loadLocalList(key: string): string[] {
  const raw = getLocalStorageValue(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function storageKey(kind: WatchKind): string {
  return kind === "category" ? CATEGORIES_KEY : PRODUCTS_KEY;
}

function localItems(): WatchItem[] {
  const categories = loadLocalList(CATEGORIES_KEY).map((value) => ({ key: value, kind: "category" as const, value }));
  const products = loadLocalList(PRODUCTS_KEY).map((value) => ({ key: value, kind: "product" as const, value }));
  return [...categories, ...products];
}

export async function loadWatchlist(): Promise<WatchItem[]> {
  if (isAuthed()) {
    const token = getToken();
    if (token) {
      try {
        const items = await listWatchlists(token);
        return items.map((item) => ({ key: String(item.id), kind: item.kind, value: item.value }));
      } catch {
        // フォールバック。
      }
    }
  }
  return localItems();
}

export async function addWatch(kind: WatchKind, value: string): Promise<WatchItem[]> {
  const trimmed = value.trim();
  if (trimmed.length === 0) return loadWatchlist();

  if (isAuthed()) {
    const token = getToken();
    if (token) {
      try {
        await addWatchlist(token, kind, trimmed);
        return loadWatchlist();
      } catch {
        // フォールバック。
      }
    }
  }

  const key = storageKey(kind);
  const list = loadLocalList(key);
  if (!list.includes(trimmed)) {
    setLocalStorageValue(key, JSON.stringify([...list, trimmed]));
  }
  return localItems();
}

export async function removeWatch(item: WatchItem): Promise<WatchItem[]> {
  if (isAuthed()) {
    const token = getToken();
    if (token) {
      try {
        await removeWatchlist(token, Number(item.key));
        return loadWatchlist();
      } catch {
        // フォールバック。
      }
    }
  }

  const key = storageKey(item.kind);
  const list = loadLocalList(key).filter((value) => value !== item.value);
  setLocalStorageValue(key, JSON.stringify(list));
  return localItems();
}
