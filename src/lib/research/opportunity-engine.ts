/**
 * Opportunity Engine + Direction Engine（STEP 12-13、フロント版）。
 *
 * backend/app/opportunity_engine.py と同一の重み・計算式を TypeScript へ移植し、
 * バックエンド未接続のモックでも API と同じ Opportunity Score / BEST_DIRECTION を
 * 得られるようにする（整合性の確保）。スコアは docs/development_plan.md セクション 11 の
 * 重み付き要素から決定論的に算出する（原則: セクション 93）。
 */

import { deriveEconomicsFor, priceGapRate } from "./economics";
import type { Economics, MatchType, ProductCatalogEntry, RiskLevel, TradeDirection } from "./types";

/** セクション 11 の初期スコア重み（合計 1.0）。 */
const WEIGHTS = {
  profitRate: 0.25,
  profitAmount: 0.2,
  demand: 0.15,
  priceGap: 0.1,
  lowCompetition: 0.1,
  supplyStability: 0.05,
  seasonality: 0.05,
  risk: 0.05,
  fxStability: 0.05,
} as const;

export const SUPPLY_STABILITY: Record<MatchType, number> = {
  EXACT: 1.0,
  MODEL_MATCH: 0.9,
  BRAND_MATCH: 0.8,
  OEM_CANDIDATE: 0.7,
  SIMILAR: 0.6,
  UNMATCHED: 0.3,
};

const RISK_SCORE: Record<RiskLevel, number> = { Low: 1.0, Medium: 0.6, High: 0.3 };

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** 1 方向のスコアと利益。 */
export interface DirectionScore {
  direction: TradeDirection;
  score: number;
  economics: Economics;
}

/** 両方向の評価結果と最良方向。 */
export interface Evaluation {
  best: DirectionScore;
  jpToCn: DirectionScore;
  cnToJp: DirectionScore;
}

function scoreDirection(entry: ProductCatalogEntry, direction: TradeDirection): DirectionScore {
  const economics = deriveEconomicsFor(entry, direction);
  const sellMarket = direction === "CN_TO_JP" ? entry.japan : entry.china;

  const factors = {
    // 利益率 40% で満点。
    profitRate: clamp01(economics.marginRate / 0.4),
    // 利益額 5,000 円で満点。
    profitAmount: clamp01(economics.estimatedProfit / 5000),
    demand: clamp01(sellMarket.demandIndex / 100),
    // 価格差 200% で満点。
    priceGap: clamp01(priceGapRate(entry) / 2),
    // 競合 0 で満点、200 で 0。
    lowCompetition: clamp01(1 - sellMarket.competitors / 200),
    supplyStability: SUPPLY_STABILITY[entry.matchType],
    // 季節商品は季節需要の上振れ余地を加点。
    seasonality: entry.seasonality !== "AllYear" ? 1.0 : 0.6,
    risk: RISK_SCORE[entry.risk],
    // 為替安定性は暫定定数（将来 exchange_rates の変動から算出）。
    fxStability: 0.8,
  };

  const weighted = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce(
    (sum, key) => sum + WEIGHTS[key] * factors[key],
    0,
  );
  const score = Math.round(clamp01(weighted) * 100);
  return { direction, score, economics };
}

/** 両方向を評価し、最良方向を決定する（backend evaluate と同一ロジック）。 */
export function evaluate(entry: ProductCatalogEntry): Evaluation {
  const jpToCn = scoreDirection(entry, "JP_TO_CN");
  const cnToJp = scoreDirection(entry, "CN_TO_JP");
  const best = jpToCn.score >= cnToJp.score ? jpToCn : cnToJp;
  return { best, jpToCn, cnToJp };
}
