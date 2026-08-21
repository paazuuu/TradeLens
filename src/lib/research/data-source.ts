/**
 * データアクセス層（STEP 15: フロント結線）。
 *
 * NEXT_PUBLIC_API_URL が設定されていればバックエンド API から取得し、
 * 未設定・到達不能時はモックデータへフォールバックする。これにより、
 * バックエンドの有無にかかわらず画面が動作する。API 応答は camelCase で
 * TypeScript のドメイン型と一致する。
 */

import { ApiError, apiGet, apiPost, isApiEnabled } from "@/lib/api/client";

import {
  type DirectionSplit,
  getDirectionSplit,
  getMarginDistribution,
  getProfitByProduct,
  getSubCategoryScores,
  type MarginBucket,
  type ProfitByProduct,
  type SubCategoryScore,
} from "./analytics";
import {
  type DashboardKpis,
  getDashboardKpis,
  getTopByDemand,
  getTopByMargin,
  getTopByPriceGap,
  getTopOpportunities,
  getTopSeasonal,
  type TopListItem,
  type TopOpportunity,
} from "./dashboard";
import { getMarketComparison, getMarketOverview, type MarketComparisonRow, type MarketOverview } from "./markets";
import {
  getBrandAnalysis,
  getOemAnalysis,
  getPriceHistory,
  getProductDetail,
  getProductForecast,
  getSimilarProducts,
  mockOpportunities,
} from "./mock-data";
import { computeMockResult, type ResearchOptions, type ResearchResult } from "./research-flow";
import { getSeasonalOpportunities, type SeasonalOpportunity } from "./seasonal";
import type {
  BrandStat,
  OemAnalysis,
  Opportunity,
  PriceHistory,
  ProductDetail,
  ProductForecast,
  SimilarProduct,
} from "./types";

export interface DashboardData {
  kpis: DashboardKpis;
  topOpportunities: TopOpportunity[];
  topPriceGap: TopListItem[];
  topMargin: TopListItem[];
  topDemand: TopListItem[];
  topSeasonal: SeasonalOpportunity[];
}

export interface AnalyticsData {
  directionSplit: DirectionSplit[];
  subCategoryScores: SubCategoryScore[];
  marginDistribution: MarginBucket[];
  profitByProduct: ProfitByProduct[];
}

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

/** 商品の価格・需要履歴（Phase 2）。API が 404 なら null、到達不能ならモック合成。 */
export async function fetchPriceHistory(id: string): Promise<PriceHistory | null> {
  if (isApiEnabled()) {
    try {
      return await apiGet<PriceHistory>(`/products/${id}/price-history`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      // 到達不能時はモックへフォールバック。
    }
  }
  return getPriceHistory(id);
}

/** 商品の価格・需要予測（Phase 2）。API が 404 なら null、到達不能ならモック合成。 */
export async function fetchForecast(id: string): Promise<ProductForecast | null> {
  if (isApiEnabled()) {
    try {
      return await apiGet<ProductForecast>(`/products/${id}/forecast`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      // 到達不能時はモックへフォールバック。
    }
  }
  return getProductForecast(id);
}

/** 商品の OEM 分析（Phase 2）。API が 404 なら null、到達不能ならモック。 */
export async function fetchOemAnalysis(id: string): Promise<OemAnalysis | null> {
  if (isApiEnabled()) {
    try {
      return await apiGet<OemAnalysis>(`/products/${id}/oem-analysis`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      // 到達不能時はモックへフォールバック。
    }
  }
  return getOemAnalysis(id);
}

/** 商品の類似・代替候補（Phase 2）。API が 404 なら null、到達不能ならモック。 */
export async function fetchSimilarProducts(id: string, limit = 5): Promise<SimilarProduct[] | null> {
  if (isApiEnabled()) {
    try {
      return await apiGet<SimilarProduct[]>(`/products/${id}/similar?limit=${limit}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      // 到達不能時はモックへフォールバック。
    }
  }
  return getSimilarProducts(id, limit);
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

/** Dashboard 集計。API があれば GET /dashboard、なければモックから合成。 */
export async function fetchDashboard(): Promise<DashboardData> {
  if (isApiEnabled()) {
    try {
      return await apiGet<DashboardData>("/dashboard");
    } catch {
      // フォールバック。
    }
  }
  return {
    kpis: getDashboardKpis(),
    topOpportunities: getTopOpportunities(),
    topPriceGap: getTopByPriceGap(),
    topMargin: getTopByMargin(),
    topDemand: getTopByDemand(),
    topSeasonal: getTopSeasonal(),
  };
}

/** ブランド・競合分析（Phase 2）。API があれば GET /analytics/brands、なければモック。 */
export async function fetchBrandAnalysis(): Promise<BrandStat[]> {
  if (isApiEnabled()) {
    try {
      return await apiGet<BrandStat[]>("/analytics/brands");
    } catch {
      // フォールバック。
    }
  }
  return getBrandAnalysis();
}

/** Analytics 集計。API があれば GET /analytics、なければモックから合成。 */
export async function fetchAnalytics(): Promise<AnalyticsData> {
  if (isApiEnabled()) {
    try {
      return await apiGet<AnalyticsData>("/analytics");
    } catch {
      // フォールバック。
    }
  }
  return {
    directionSplit: getDirectionSplit(),
    subCategoryScores: getSubCategoryScores(),
    marginDistribution: getMarginDistribution(),
    profitByProduct: getProfitByProduct(),
  };
}
