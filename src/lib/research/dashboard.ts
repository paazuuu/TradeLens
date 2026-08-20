/**
 * Dashboard（UI-001）向けの集計。docs/development_plan.md セクション 19, 55。
 *
 * 「今日どの商品に商機があるか」を一画面で把握するための KPI と Top リストを
 * モックデータから決定論的に導出する（原則: セクション 93）。
 */

import { deriveReasons } from "./economics";
import { mockOpportunities, productCatalog } from "./mock-data";
import { evaluate } from "./opportunity-engine";
import { getSeasonalOpportunities, type SeasonalOpportunity } from "./seasonal";
import type { ReasonCode, TradeDirection } from "./types";

/** 有望とみなす Opportunity Score の下限（backend insights.PROMISING_SCORE と一致）。 */
const PROMISING_SCORE = 60;

/** ダッシュボード上部の KPI（セクション 55）。 */
export interface DashboardKpis {
  totalProducts: number;
  promising: number;
  jpToCn: number;
  cnToJp: number;
  seasonal: number;
  avgMargin: number;
}

export function getDashboardKpis(): DashboardKpis {
  const promisingList = mockOpportunities.filter((o) => o.score >= PROMISING_SCORE);
  const avgMargin =
    promisingList.length === 0 ? 0 : promisingList.reduce((sum, o) => sum + o.marginRate, 0) / promisingList.length;

  return {
    totalProducts: mockOpportunities.length,
    promising: promisingList.length,
    jpToCn: promisingList.filter((o) => o.bestDirection === "JP_TO_CN").length,
    cnToJp: promisingList.filter((o) => o.bestDirection === "CN_TO_JP").length,
    seasonal: productCatalog.filter((e) => e.seasonality !== "AllYear").length,
    avgMargin,
  };
}

/** メインの Top Opportunities 行（有望理由付き）。 */
export interface TopOpportunity {
  id: string;
  name: string;
  subCategory: string;
  bestDirection: TradeDirection;
  score: number;
  estimatedProfit: number;
  marginRate: number;
  topReason: ReasonCode | null;
}

export function getTopOpportunities(limit = 5): TopOpportunity[] {
  return [...mockOpportunities]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((o) => {
      const entry = productCatalog.find((e) => e.id === o.id);
      const best = entry ? evaluate(entry).best : null;
      const reasons = entry && best ? deriveReasons(entry, best.direction, best.economics) : [];
      return {
        id: o.id,
        name: o.name,
        subCategory: o.subCategory,
        bestDirection: o.bestDirection,
        score: o.score,
        estimatedProfit: o.estimatedProfit,
        marginRate: o.marginRate,
        topReason: reasons[0] ?? null,
      };
    });
}

/** 下部 Top リストの 1 行。value の意味は各リストで異なる。 */
export interface TopListItem {
  id: string;
  name: string;
  direction: TradeDirection;
  value: number;
}

export function getTopByPriceGap(limit = 5): TopListItem[] {
  return [...mockOpportunities]
    .sort((a, b) => b.priceGapRate - a.priceGapRate)
    .slice(0, limit)
    .map((o) => ({ id: o.id, name: o.name, direction: o.bestDirection, value: o.priceGapRate }));
}

export function getTopByMargin(limit = 5): TopListItem[] {
  return [...mockOpportunities]
    .sort((a, b) => b.marginRate - a.marginRate)
    .slice(0, limit)
    .map((o) => ({ id: o.id, name: o.name, direction: o.bestDirection, value: o.marginRate }));
}

/** 需要は販売先市場の需要指数を用いる（CN_TO_JP は日本、JP_TO_CN は中国）。 */
export function getTopByDemand(limit = 5): TopListItem[] {
  return productCatalog
    .map((e) => ({
      id: e.id,
      name: e.name,
      direction: e.bestDirection,
      value: e.bestDirection === "CN_TO_JP" ? e.japan.demandIndex : e.china.demandIndex,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** 季節先取り Top（ピークが近い順）。 */
export function getTopSeasonal(limit = 5): SeasonalOpportunity[] {
  return getSeasonalOpportunities().slice(0, limit);
}
