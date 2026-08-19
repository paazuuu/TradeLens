/**
 * Analytics（UI-009）向けの集計。docs/development_plan.md セクション 63。
 *
 * Opportunity 要約から方向構成・サブカテゴリー別スコア・利益率分布・
 * 商品別推定利益を集計してチャート用データを作る。
 */

import { mockOpportunities } from "./mock-data";
import type { TradeDirection } from "./types";

/** 商流方向ごとの件数と平均利益。 */
export interface DirectionSplit {
  direction: TradeDirection;
  count: number;
  avgProfit: number;
}

export function getDirectionSplit(): DirectionSplit[] {
  const directions: TradeDirection[] = ["JP_TO_CN", "CN_TO_JP"];
  return directions.map((direction) => {
    const items = mockOpportunities.filter((o) => o.bestDirection === direction);
    const avgProfit =
      items.length === 0 ? 0 : Math.round(items.reduce((sum, o) => sum + o.estimatedProfit, 0) / items.length);
    return { direction, count: items.length, avgProfit };
  });
}

/** サブカテゴリー別の平均 Opportunity Score（降順）。 */
export interface SubCategoryScore {
  subCategory: string;
  avgScore: number;
  count: number;
}

export function getSubCategoryScores(): SubCategoryScore[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const o of mockOpportunities) {
    const acc = map.get(o.subCategory) ?? { total: 0, count: 0 };
    acc.total += o.score;
    acc.count += 1;
    map.set(o.subCategory, acc);
  }
  return [...map.entries()]
    .map(([subCategory, acc]) => ({ subCategory, avgScore: Math.round(acc.total / acc.count), count: acc.count }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

/** 利益率の分布バケット。 */
export interface MarginBucket {
  id: string;
  label: string;
  count: number;
}

/** 利益率を 4 区間（<10% / 10-20% / 20-30% / 30%+）に集計する。 */
export function getMarginDistribution(): MarginBucket[] {
  const buckets: MarginBucket[] = [
    { id: "lt10", label: "< 10%", count: 0 },
    { id: "10to20", label: "10–20%", count: 0 },
    { id: "20to30", label: "20–30%", count: 0 },
    { id: "gte30", label: "30%+", count: 0 },
  ];
  for (const o of mockOpportunities) {
    const pct = o.marginRate * 100;
    if (pct < 10) buckets[0].count += 1;
    else if (pct < 20) buckets[1].count += 1;
    else if (pct < 30) buckets[2].count += 1;
    else buckets[3].count += 1;
  }
  return buckets;
}

/** 商品別の推定利益（上位 N、降順）。 */
export interface ProfitByProduct {
  id: string;
  name: string;
  estimatedProfit: number;
  direction: TradeDirection;
}

export function getProfitByProduct(limit = 8): ProfitByProduct[] {
  return [...mockOpportunities]
    .sort((a, b) => b.estimatedProfit - a.estimatedProfit)
    .slice(0, limit)
    .map((o) => ({ id: o.id, name: o.name, estimatedProfit: o.estimatedProfit, direction: o.bestDirection }));
}
