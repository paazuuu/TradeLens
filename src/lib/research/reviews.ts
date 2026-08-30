/**
 * レビュー分析（Phase 2、docs/development_plan.md セクション 41）。
 *
 * backend/app/reviews.py と同一の生成式（FNV-1a 由来の擬似乱数 + 偶数丸め）を移植し、
 * API 未接続のモックでも同一のセンチメントを返す（整合性の原則: セクション 93）。
 */

import { priceGapRate } from "./economics";
import { pyRound, unitNoise } from "./history";
import type { ProductCatalogEntry, ReviewAnalysis, ReviewAspect, ReviewAspectCode, TradeDirection } from "./types";

const ASPECTS: ReviewAspectCode[] = ["quality", "price", "delivery", "durability", "design", "usability"];

const RISK_ADJ: Record<string, number> = { Low: 10, Medium: 0, High: -12 };

function clamp(low: number, high: number, value: number): number {
  return Math.max(low, Math.min(high, value));
}

function sellDemand(entry: ProductCatalogEntry, direction: TradeDirection): number {
  return direction === "CN_TO_JP" ? entry.japan.demandIndex : entry.china.demandIndex;
}

/** 1 商品のレビュー・センチメントを合成する。 */
export function analyzeReviews(entry: ProductCatalogEntry, direction: TradeDirection): ReviewAnalysis {
  const demand = sellDemand(entry, direction);
  const riskAdj = RISK_ADJ[entry.risk] ?? 0;
  const baseNoise = unitNoise(`${entry.id}:review:overall`) * 6;
  const overall = clamp(30, 95, pyRound(55 + (demand - 60) * 0.4 + riskAdj + baseNoise));

  const positive = clamp(0, 100, pyRound(overall * 0.9));
  const negative = clamp(0, 100, pyRound((100 - overall) * 0.7));
  const neutral = clamp(0, 100, 100 - positive - negative);

  const sampleSize = entry.japan.reviewCount + entry.china.reviewCount;
  const gap = priceGapRate(entry);

  const aspects: ReviewAspect[] = [];
  const weights: number[] = [];
  let weightTotal = 0;
  for (const aspect of ASPECTS) {
    let adjust = 0;
    if (aspect === "quality" || aspect === "durability") adjust = riskAdj;
    else if (aspect === "price") adjust = Math.min(15, gap * 8);
    else if (aspect === "usability") adjust = (demand - 60) * 0.2;
    const noise = unitNoise(`${entry.id}:review:${aspect}`) * 8;
    const sentiment = clamp(20, 98, pyRound(overall + adjust + noise));
    const weight = 0.6 + (unitNoise(`${entry.id}:weight:${aspect}`) + 1) / 2;
    weights.push(weight);
    weightTotal += weight;
    aspects.push({ aspect, sentiment, mentions: 0 });
  }

  if (weightTotal > 0 && sampleSize > 0) {
    aspects.forEach((aspect, index) => {
      aspect.mentions = pyRound((sampleSize * weights[index]) / weightTotal);
    });
  }

  return { productId: entry.id, overall, positive, neutral, negative, sampleSize, aspects };
}
