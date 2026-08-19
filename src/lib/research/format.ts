/**
 * 越境商品リサーチ用の数値フォーマッタ。
 * 言語依存のラベル（方向・季節・リスク・マッチ型）は i18n 辞書（lib/i18n/messages）で管理する。
 */

import type { ConfidenceTier } from "./types";

const jpyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

/** 円建て金額を「¥12,800」形式で整形する。 */
export function formatJpy(value: number): string {
  return jpyFormatter.format(value);
}

/** 0.0〜1.0 の比率を「38%」形式のパーセント表示にする。 */
export function formatPercent(ratio: number, fractionDigits = 0): string {
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}

/**
 * 信頼度（0〜100%）を High / Medium / Low のティアに変換する（セクション 95）。
 * 80% 以上を High、60% 以上を Medium、それ未満を Low とする。
 */
export function confidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 80) return "High";
  if (confidence >= 60) return "Medium";
  return "Low";
}
