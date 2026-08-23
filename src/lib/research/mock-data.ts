/**
 * モックの商品カタログと、そこから導出する商機データ（Backend 接続前の検証用、STEP 3）。
 *
 * 生カタログ（productCatalog）を単一の真実とし、Opportunity 要約と ProductDetail を
 * economics エンジンで決定論的に導出する。実データ接続時（STEP 15）に productCatalog を
 * API 呼び出しへ差し替える。データはすべて架空であり、実在ブランド・価格を示さない。
 */

import { brandAnalysis } from "./brands";
import { deriveConfidence, deriveReasons, priceGapRate } from "./economics";
import { type ForecastResult, forecastDemand, forecastPrice } from "./forecast";
import { type SeriesPoint, syntheticSeries, ymOf } from "./history";
import { compareImages } from "./images";
import { keywordGaps } from "./keywords";
import { analyzeOem } from "./oem";
import { evaluate } from "./opportunity-engine";
import { analyzeReviews } from "./reviews";
import { findSimilar } from "./similar";
import type {
  BrandStat,
  ForecastSeries,
  ImageComparison,
  KeywordGap,
  MarketSnapshot,
  OemAnalysis,
  Opportunity,
  PriceHistory,
  ProductCatalogEntry,
  ProductDetail,
  ProductForecast,
  ReviewAnalysis,
  SimilarProduct,
  TimeSeriesPoint,
} from "./types";

export const productCatalog: ProductCatalogEntry[] = [
  {
    id: "opp-001",
    name: "折りたたみLEDランタン 充電式",
    brand: "OEM",
    category: "キャンプ用品",
    subCategory: "LEDランタン",
    model: "LN-220C",
    sizeTier: "S",
    bestDirection: "CN_TO_JP",
    seasonality: "Summer",
    risk: "Low",
    matchType: "OEM_CANDIDATE",
    matchConfidence: 86,
    score: 92,
    japan: { price: 4980, competitors: 28, demandIndex: 82, reviewCount: 1240 },
    china: { price: 1720, competitors: 140, demandIndex: 55, reviewCount: 320 },
  },
  {
    id: "opp-002",
    name: "ソロキャンプ用軽量アルミクッカーセット",
    brand: "TrailMate",
    category: "キャンプ用品",
    subCategory: "クッカー",
    model: "TM-CK3",
    sizeTier: "M",
    bestDirection: "CN_TO_JP",
    seasonality: "AllYear",
    risk: "Low",
    matchType: "MODEL_MATCH",
    matchConfidence: 91,
    score: 88,
    japan: { price: 6800, competitors: 34, demandIndex: 74, reviewCount: 860 },
    china: { price: 2950, competitors: 95, demandIndex: 60, reviewCount: 410 },
  },
  {
    id: "opp-003",
    name: "ワンタッチ ドームテント 2人用",
    brand: "TrailMate",
    category: "キャンプ用品",
    subCategory: "ワンタッチテント",
    model: "TM-DT2",
    sizeTier: "L",
    bestDirection: "CN_TO_JP",
    seasonality: "Summer",
    risk: "Medium",
    matchType: "BRAND_MATCH",
    matchConfidence: 78,
    score: 84,
    japan: { price: 12800, competitors: 46, demandIndex: 78, reviewCount: 540 },
    china: { price: 6400, competitors: 120, demandIndex: 58, reviewCount: 260 },
  },
  {
    id: "opp-004",
    name: "折りたたみローチェア アウトドア",
    brand: "OEM",
    category: "キャンプ用品",
    subCategory: "ローチェア",
    model: "LC-08",
    sizeTier: "M",
    bestDirection: "CN_TO_JP",
    seasonality: "AllYear",
    risk: "Low",
    matchType: "SIMILAR",
    matchConfidence: 72,
    score: 81,
    japan: { price: 5480, competitors: 38, demandIndex: 68, reviewCount: 720 },
    china: { price: 2380, competitors: 160, demandIndex: 52, reviewCount: 300 },
  },
  {
    id: "opp-005",
    name: "日本製 高性能ガスバーナー CB缶対応",
    brand: "SoraHeat",
    category: "キャンプ用品",
    subCategory: "バーナー",
    model: "SH-B120",
    sizeTier: "S",
    bestDirection: "JP_TO_CN",
    seasonality: "AllYear",
    risk: "High",
    matchType: "EXACT",
    matchConfidence: 96,
    score: 90,
    japan: { price: 7200, competitors: 22, demandIndex: 64, reviewCount: 1520 },
    china: { price: 13400, competitors: 30, demandIndex: 80, reviewCount: 210 },
  },
  {
    id: "opp-006",
    name: "チタン製シングルマグ 450ml",
    brand: "SoraHeat",
    category: "キャンプ用品",
    subCategory: "ケトル",
    model: "SH-TM450",
    sizeTier: "S",
    bestDirection: "JP_TO_CN",
    seasonality: "AllYear",
    risk: "Low",
    matchType: "EXACT",
    matchConfidence: 94,
    score: 86,
    japan: { price: 3400, competitors: 26, demandIndex: 60, reviewCount: 980 },
    china: { price: 6200, competitors: 38, demandIndex: 76, reviewCount: 180 },
  },
  {
    id: "opp-007",
    name: "USB充電式 コンパクトランタン ミニ",
    brand: "OEM",
    category: "キャンプ用品",
    subCategory: "USBランタン",
    model: "UL-01",
    sizeTier: "S",
    bestDirection: "CN_TO_JP",
    seasonality: "Summer",
    risk: "Low",
    matchType: "OEM_CANDIDATE",
    matchConfidence: 68,
    score: 79,
    japan: { price: 2980, competitors: 52, demandIndex: 66, reviewCount: 640 },
    china: { price: 980, competitors: 180, demandIndex: 50, reviewCount: 220 },
  },
  {
    id: "opp-008",
    name: "折りたたみキャンプテーブル アルミ",
    brand: "TrailMate",
    category: "キャンプ用品",
    subCategory: "キャンプテーブル",
    model: "TM-TB60",
    sizeTier: "L",
    bestDirection: "CN_TO_JP",
    seasonality: "AllYear",
    risk: "Medium",
    matchType: "MODEL_MATCH",
    matchConfidence: 83,
    score: 74,
    japan: { price: 8900, competitors: 44, demandIndex: 62, reviewCount: 480 },
    china: { price: 4600, competitors: 110, demandIndex: 54, reviewCount: 190 },
  },
  {
    id: "opp-009",
    name: "ファミリーテント 大型 5人用",
    brand: "OutFieldPro",
    category: "キャンプ用品",
    subCategory: "ファミリーテント",
    model: "OFP-FT5",
    sizeTier: "L",
    bestDirection: "CN_TO_JP",
    seasonality: "Summer",
    risk: "High",
    matchType: "SIMILAR",
    matchConfidence: 61,
    score: 58,
    japan: { price: 24800, competitors: 58, demandIndex: 70, reviewCount: 320 },
    china: { price: 15200, competitors: 90, demandIndex: 56, reviewCount: 140 },
  },
  {
    id: "opp-010",
    name: "ホットサンドメーカー 直火式 IH非対応",
    brand: "OEM",
    category: "キャンプ用品",
    subCategory: "ホットサンドメーカー",
    model: "HS-11",
    sizeTier: "S",
    bestDirection: "CN_TO_JP",
    seasonality: "Autumn",
    risk: "Low",
    matchType: "OEM_CANDIDATE",
    matchConfidence: 74,
    score: 82,
    japan: { price: 3980, competitors: 30, demandIndex: 72, reviewCount: 560 },
    china: { price: 1560, competitors: 130, demandIndex: 52, reviewCount: 240 },
  },
  {
    id: "opp-011",
    name: "ガスランタン アウトドア用 マントル式",
    brand: "OutFieldPro",
    category: "キャンプ用品",
    subCategory: "ガスランタン",
    model: "OFP-GL2",
    sizeTier: "M",
    bestDirection: "JP_TO_CN",
    seasonality: "Autumn",
    risk: "High",
    matchType: "BRAND_MATCH",
    matchConfidence: 80,
    score: 76,
    japan: { price: 9800, competitors: 24, demandIndex: 58, reviewCount: 700 },
    china: { price: 16800, competitors: 36, demandIndex: 78, reviewCount: 160 },
  },
  {
    id: "opp-012",
    name: "軽量ダウンシュラフ 3シーズン用",
    brand: "OutFieldPro",
    category: "キャンプ用品",
    subCategory: "シュラフ",
    model: "OFP-SB3",
    sizeTier: "M",
    bestDirection: "CN_TO_JP",
    seasonality: "Autumn",
    risk: "Medium",
    matchType: "SIMILAR",
    matchConfidence: 70,
    score: 80,
    japan: { price: 11800, competitors: 40, demandIndex: 68, reviewCount: 430 },
    china: { price: 5900, competitors: 100, demandIndex: 55, reviewCount: 200 },
  },
];

/** カタログ 1 件を Opportunity 要約へ変換する（score/bestDirection はエンジンで導出）。 */
function toOpportunity(entry: ProductCatalogEntry): Opportunity {
  const { best } = evaluate(entry);
  return {
    id: entry.id,
    name: entry.name,
    brand: entry.brand,
    category: entry.category,
    subCategory: entry.subCategory,
    imageUrl: entry.imageUrl,
    bestDirection: best.direction,
    japanPrice: entry.japan.price,
    chinaPrice: entry.china.price,
    priceGapRate: priceGapRate(entry),
    estimatedProfit: best.economics.estimatedProfit,
    marginRate: best.economics.marginRate,
    seasonality: entry.seasonality,
    risk: entry.risk,
    score: best.score,
    matchType: entry.matchType,
    matchConfidence: entry.matchConfidence,
  };
}

/** Opportunity Ranking / Dashboard 向けの要約リスト（economics で導出）。 */
export const mockOpportunities: Opportunity[] = productCatalog.map(toOpportunity);

/** 指定 ID の商品詳細（UI-005）を導出する。存在しなければ null。 */
export function getProductDetail(id: string): ProductDetail | null {
  const entry = productCatalog.find((item) => item.id === id);
  if (!entry) return null;

  const { best } = evaluate(entry);
  const direction = best.direction;
  const economics = best.economics;
  return {
    id: entry.id,
    name: entry.name,
    brand: entry.brand,
    category: entry.category,
    subCategory: entry.subCategory,
    model: entry.model,
    imageUrl: entry.imageUrl,
    bestDirection: direction,
    seasonality: entry.seasonality,
    risk: entry.risk,
    matchType: entry.matchType,
    matchConfidence: entry.matchConfidence,
    score: best.score,
    japan: entry.japan,
    china: entry.china,
    priceGapRate: priceGapRate(entry),
    economics,
    reasons: deriveReasons(entry, direction, economics),
    confidence: deriveConfidence(entry, direction, economics),
  };
}

// ---- Phase 2: 価格履歴・予測（backend timeseries.py に対応）----

function snapshotFor(entry: ProductCatalogEntry, market: string): MarketSnapshot {
  return market === "JP" ? entry.japan : entry.china;
}

function seriesFor(entry: ProductCatalogEntry, market: string, now: Date): SeriesPoint[] {
  const snap = snapshotFor(entry, market);
  return syntheticSeries(
    entry.id,
    market,
    snap.price,
    snap.demandIndex,
    entry.seasonality,
    now.getFullYear(),
    now.getMonth() + 1,
  );
}

function toTimeSeries(points: SeriesPoint[]): TimeSeriesPoint[] {
  return points.map((p) => ({ date: ymOf(p.year, p.month), price: p.price, demand: p.demand }));
}

function toForecastSeries(result: ForecastResult): ForecastSeries {
  return {
    points: result.points.map((p) => ({ date: ymOf(p.year, p.month), value: p.value })),
    slopePerMonth: result.slopePerMonth,
    confidence: result.confidence,
  };
}

/** 指定商品の日中価格・需要履歴（過去 12 か月）を合成する。存在しなければ null。 */
export function getPriceHistory(id: string, now: Date = new Date()): PriceHistory | null {
  const entry = productCatalog.find((item) => item.id === id);
  if (!entry) return null;
  return {
    productId: entry.id,
    japan: toTimeSeries(seriesFor(entry, "JP", now)),
    china: toTimeSeries(seriesFor(entry, "CN", now)),
  };
}

/** 指定商品の OEM 分析。存在しなければ null。 */
export function getOemAnalysis(id: string): OemAnalysis | null {
  const entry = productCatalog.find((item) => item.id === id);
  if (!entry) return null;
  return analyzeOem(entry);
}

/** 指定商品に類似する商品を探索する。存在しなければ null。 */
export function getSimilarProducts(id: string, limit = 5): SimilarProduct[] | null {
  const entry = productCatalog.find((item) => item.id === id);
  if (!entry) return null;
  return findSimilar(entry, productCatalog, limit);
}

/** ブランド別の集計（Phase 2）。 */
export function getBrandAnalysis(): BrandStat[] {
  return brandAnalysis(productCatalog);
}

/** 中日市場のキーワード差分析（Phase 2）。 */
export function getKeywordGaps(): KeywordGap[] {
  return keywordGaps(productCatalog);
}

/** 指定商品のレビュー分析（有望方向の販売市場基準）。存在しなければ null。 */
export function getReviewAnalysis(id: string): ReviewAnalysis | null {
  const entry = productCatalog.find((item) => item.id === id);
  if (!entry) return null;
  return analyzeReviews(entry, evaluate(entry).best.direction);
}

/** 指定商品の画像比較（Phase 2）。存在しなければ null。 */
export function getImageComparison(id: string): ImageComparison | null {
  const entry = productCatalog.find((item) => item.id === id);
  if (!entry) return null;
  return compareImages(entry);
}

/** 指定商品の価格・需要予測（有望方向の販売市場、先 6 か月）。存在しなければ null。 */
export function getProductForecast(id: string, now: Date = new Date()): ProductForecast | null {
  const entry = productCatalog.find((item) => item.id === id);
  if (!entry) return null;
  const best = evaluate(entry).best;
  const market = best.direction === "CN_TO_JP" ? "JP" : "CN";
  const series = seriesFor(entry, market, now);
  const prices = series.map((p) => p.price);
  const demand = series.map((p) => p.demand);
  const last = series[series.length - 1];
  return {
    productId: entry.id,
    market,
    bestDirection: best.direction,
    priceForecast: toForecastSeries(forecastPrice(prices, entry.seasonality, last.year, last.month)),
    demandForecast: toForecastSeries(forecastDemand(demand, entry.seasonality, last.year, last.month)),
  };
}
