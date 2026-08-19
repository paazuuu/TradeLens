/**
 * Seasonal（UI-008）向けの季節需要タイミング算定。
 * docs/development_plan.md セクション 13-15, 23, 62, 81。
 *
 * 実績データが無い MVP 段階のため、月・季節ベースのルールで需要ピーク時期と
 * 推奨仕入れ時期を導出する（STEP 14 初期版）。データ蓄積後に予測モデルへ移行する。
 */

import { deriveEconomics } from "./economics";
import { productCatalog } from "./mock-data";
import type { Season, TradeDirection } from "./types";

/** 需要接近の緊急度。🔥30日 / 🟢60日 / 🟡90日 / それ以遠。 */
export type SeasonUrgency = "hot" | "soon" | "watch" | "later";

/** 季節ピークの代表月（1-12）。日本市場基準の MVP 値。 */
const SEASON_PEAK_MONTH: Record<Exclude<Season, "AllYear">, number> = {
  Spring: 4,
  Summer: 7,
  Autumn: 10,
  Winter: 12,
};

/** 指定月の 15 日を基準に、now から次回ピークまでの日数を求める。 */
function daysUntilPeak(now: Date, peakMonth: number): number {
  const year = now.getFullYear();
  let peak = new Date(year, peakMonth - 1, 15);
  if (peak.getTime() < now.getTime()) {
    peak = new Date(year + 1, peakMonth - 1, 15);
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((peak.getTime() - now.getTime()) / msPerDay);
}

function urgencyOf(daysToPeak: number): SeasonUrgency {
  if (daysToPeak <= 30) return "hot";
  if (daysToPeak <= 60) return "soon";
  if (daysToPeak <= 90) return "watch";
  return "later";
}

/** 需要接近度に応じた予測スコアの上乗せ。 */
function scoreBoost(urgency: SeasonUrgency): number {
  switch (urgency) {
    case "hot":
      return 12;
    case "soon":
      return 8;
    case "watch":
      return 4;
    default:
      return 0;
  }
}

/** 季節商品 1 件の需要予測（UI-008）。 */
export interface SeasonalOpportunity {
  id: string;
  name: string;
  subCategory: string;
  bestDirection: TradeDirection;
  season: Exclude<Season, "AllYear">;
  peakMonth: number;
  daysToPeak: number;
  /** 推奨仕入れ開始月（ピークの約 2 か月前）。 */
  recommendedBuyMonth: number;
  urgency: SeasonUrgency;
  currentScore: number;
  predictedScore: number;
  estimatedProfit: number;
}

/**
 * 季節商品（通年を除く）の需要予測リストを、ピークまでの近さ順で返す。
 * @param now 基準日時。省略時は現在時刻。
 */
export function getSeasonalOpportunities(now: Date = new Date()): SeasonalOpportunity[] {
  const items: SeasonalOpportunity[] = [];

  for (const entry of productCatalog) {
    if (entry.seasonality === "AllYear") continue;
    const season = entry.seasonality;
    const peakMonth = SEASON_PEAK_MONTH[season];
    const daysToPeak = daysUntilPeak(now, peakMonth);
    const urgency = urgencyOf(daysToPeak);
    const recommendedBuyMonth = ((peakMonth - 2 + 11) % 12) + 1;
    const economics = deriveEconomics(entry);

    items.push({
      id: entry.id,
      name: entry.name,
      subCategory: entry.subCategory,
      bestDirection: entry.bestDirection,
      season,
      peakMonth,
      daysToPeak,
      recommendedBuyMonth,
      urgency,
      currentScore: entry.score,
      predictedScore: Math.min(100, entry.score + scoreBoost(urgency)),
      estimatedProfit: economics.estimatedProfit,
    });
  }

  return items.sort((a, b) => a.daysToPeak - b.daysToPeak);
}
