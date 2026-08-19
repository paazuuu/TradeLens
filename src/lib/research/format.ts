/**
 * 越境商品リサーチ用の表示フォーマッタとラベル・配色ヘルパー。
 * 表示ロジックのみを扱い、ビジネス計算は Rule Engine 側に置く（セクション 92）。
 */

import type { ConfidenceTier, MatchType, RiskLevel, Season, TradeDirection } from "./types";

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

/** 商流方向の短縮ラベル（テーブル向け）。 */
export function directionShortLabel(direction: TradeDirection): string {
  return direction === "JP_TO_CN" ? "日→中" : "中→日";
}

/** 商流方向の完全ラベル。 */
export function directionLabel(direction: TradeDirection): string {
  return direction === "JP_TO_CN" ? "日本 → 中国" : "中国 → 日本";
}

/** 季節性の日本語ラベル。 */
export function seasonLabel(season: Season): string {
  switch (season) {
    case "Spring":
      return "春";
    case "Summer":
      return "夏";
    case "Autumn":
      return "秋";
    case "Winter":
      return "冬";
    default:
      return "通年";
  }
}

/** リスクレベルの日本語ラベル。 */
export function riskLabel(risk: RiskLevel): string {
  switch (risk) {
    case "Low":
      return "低";
    case "Medium":
      return "中";
    default:
      return "高";
  }
}

/** マッチタイプの表示ラベル。 */
export function matchTypeLabel(matchType: MatchType): string {
  switch (matchType) {
    case "EXACT":
      return "完全一致";
    case "BRAND_MATCH":
      return "ブランド一致";
    case "MODEL_MATCH":
      return "モデル一致";
    case "SIMILAR":
      return "高類似";
    case "OEM_CANDIDATE":
      return "OEM候補";
    default:
      return "比較対象なし";
  }
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
