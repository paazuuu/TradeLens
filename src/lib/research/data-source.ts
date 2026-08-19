/**
 * データアクセス層（STEP 15: フロント結線）。
 *
 * NEXT_PUBLIC_API_URL が設定されていればバックエンド API から取得し、
 * 未設定・到達不能時はモックデータへフォールバックする。これにより、
 * バックエンドの有無にかかわらず画面が動作する。API 応答は camelCase で
 * TypeScript のドメイン型と一致する。
 */

import { ApiError, apiGet, apiPost, isApiEnabled } from "@/lib/api/client";

import { getMarketComparison, getMarketOverview, type MarketComparisonRow, type MarketOverview } from "./markets";
import { getProductDetail, mockOpportunities } from "./mock-data";
import { computeMockResult, type ResearchOptions, type ResearchResult } from "./research-flow";
import { getSeasonalOpportunities, type SeasonalOpportunity } from "./seasonal";
import type { Opportunity, ProductDetail } from "./types";

export interface MarketsData {
  overview: MarketOverview;
  comparison: MarketComparisonRow[];
}

/** 有望商品ランキング。 */
export async function fetchOpportunities(): Promise<Opportunity[]> {
  if (isApiEnabled()) {
    try {
      return await apiGet<Opportunity[]>("/opportunities");
    } catch {
      // ネットワーク等の失敗時はモックへフォールバック。
    }
  }
  return mockOpportunities;
}

/** 商品詳細。API が 404 を返した場合は null（存在しない）。到達不能ならモック。 */
export async function fetchProductDetail(id: string): Promise<ProductDetail | null> {
  if (isApiEnabled()) {
    try {
      return await apiGet<ProductDetail>(`/products/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      // 到達不能時はモックへフォールバック。
    }
  }
  return getProductDetail(id);
}

/** 日中市場比較（KPI + サブカテゴリー別）。 */
export async function fetchMarkets(): Promise<MarketsData> {
  if (isApiEnabled()) {
    try {
      return await apiGet<MarketsData>("/markets");
    } catch {
      // フォールバック。
    }
  }
  return { overview: getMarketOverview(), comparison: getMarketComparison() };
}

/** 季節商機。 */
export async function fetchSeasonal(): Promise<SeasonalOpportunity[]> {
  if (isApiEnabled()) {
    try {
      return await apiGet<SeasonalOpportunity[]>("/seasonal");
    } catch {
      // フォールバック。
    }
  }
  return getSeasonalOpportunities();
}

/** AI リサーチ実行。API があれば POST /research、なければローカル計算。 */
export async function runResearch(options: ResearchOptions): Promise<ResearchResult> {
  if (isApiEnabled()) {
    try {
      const job = await apiPost<{ result: ResearchResult }>("/research", options);
      return job.result;
    } catch {
      // フォールバック。
    }
  }
  return computeMockResult(options);
}
