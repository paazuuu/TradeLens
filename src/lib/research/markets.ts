/**
 * Markets（UI-007）向けの市場集計。docs/development_plan.md セクション 61。
 *
 * 商品カタログをサブカテゴリー単位で集計し、日本市場と中国市場の平均価格・中央値・
 * 競合・需要を比較する。集計は決定論的なコード側で行う（原則: セクション 93）。
 */

import { productCatalog } from "./mock-data";
import { evaluate } from "./opportunity-engine";
import type { TradeDirection } from "./types";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** 片方の市場の集計値。 */
export interface MarketAggregate {
  avgPrice: number;
  medianPrice: number;
  avgCompetitors: number;
  avgDemand: number;
}

/** サブカテゴリー 1 件分の日中比較行。 */
export interface MarketComparisonRow {
  subCategory: string;
  productCount: number;
  japan: MarketAggregate;
  china: MarketAggregate;
  avgScore: number;
  /** 有望方向の多数決（同数なら双方向の意で null）。 */
  dominantDirection: TradeDirection | null;
}

function aggregateSide(prices: number[], competitors: number[], demand: number[]): MarketAggregate {
  return {
    avgPrice: Math.round(average(prices)),
    medianPrice: Math.round(median(prices)),
    avgCompetitors: Math.round(average(competitors)),
    avgDemand: Math.round(average(demand)),
  };
}

/** サブカテゴリー単位で日中市場を比較した行を返す（スコア降順）。 */
export function getMarketComparison(): MarketComparisonRow[] {
  const bySubCategory = new Map<string, typeof productCatalog>();

  for (const entry of productCatalog) {
    const list = bySubCategory.get(entry.subCategory) ?? [];
    list.push(entry);
    bySubCategory.set(entry.subCategory, list);
  }

  const rows: MarketComparisonRow[] = [];

  for (const [subCategory, entries] of bySubCategory) {
    // スコア・商流方向はエンジンで導出し、Opportunity 一覧と整合させる。
    const evaluations = entries.map((e) => evaluate(e).best);
    const exportCount = evaluations.filter((b) => b.direction === "JP_TO_CN").length;
    const importCount = evaluations.length - exportCount;
    let dominantDirection: TradeDirection | null = null;
    if (exportCount > importCount) dominantDirection = "JP_TO_CN";
    else if (importCount > exportCount) dominantDirection = "CN_TO_JP";

    rows.push({
      subCategory,
      productCount: entries.length,
      japan: aggregateSide(
        entries.map((e) => e.japan.price),
        entries.map((e) => e.japan.competitors),
        entries.map((e) => e.japan.demandIndex),
      ),
      china: aggregateSide(
        entries.map((e) => e.china.price),
        entries.map((e) => e.china.competitors),
        entries.map((e) => e.china.demandIndex),
      ),
      avgScore: Math.round(average(evaluations.map((b) => b.score))),
      dominantDirection,
    });
  }

  return rows.sort((a, b) => b.avgScore - a.avgScore);
}

/** 市場全体のサマリ（KPI 用）。 */
export interface MarketOverview {
  japanAvgPrice: number;
  chinaAvgPrice: number;
  japanAvgCompetitors: number;
  chinaAvgCompetitors: number;
  japanAvgDemand: number;
  chinaAvgDemand: number;
}

export function getMarketOverview(): MarketOverview {
  return {
    japanAvgPrice: Math.round(average(productCatalog.map((e) => e.japan.price))),
    chinaAvgPrice: Math.round(average(productCatalog.map((e) => e.china.price))),
    japanAvgCompetitors: Math.round(average(productCatalog.map((e) => e.japan.competitors))),
    chinaAvgCompetitors: Math.round(average(productCatalog.map((e) => e.china.competitors))),
    japanAvgDemand: Math.round(average(productCatalog.map((e) => e.japan.demandIndex))),
    chinaAvgDemand: Math.round(average(productCatalog.map((e) => e.china.demandIndex))),
  };
}
