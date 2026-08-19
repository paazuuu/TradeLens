"use client";

import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { type Messages, messages } from "./messages";

/**
 * 現在の表示ロケールと、その言語の文言辞書を返す。
 * ロケールは preferences ストア（cookie 永続化）から取得するため、
 * 言語切り替えはアプリ全体に即時反映され、リロードでも保持される。
 */
export function useI18n(): { locale: "ja" | "zh"; m: Messages } {
  const locale = usePreferencesStore((state) => state.values.locale);
  return { locale, m: messages[locale] };
}
