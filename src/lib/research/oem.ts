/**
 * OEM 分析エンジン（Phase 2、docs/development_plan.md セクション 41・88 の 15）。
 *
 * backend/app/oem.py と同一の重み・しきい値を移植し、API 未接続のモックでも同じ
 * OEM 可能性スコアを返す（整合性の原則: セクション 93）。
 */

import { priceGapRate } from "./economics";
import { clamp01, SUPPLY_STABILITY } from "./opportunity-engine";
import type { MatchType, OemAnalysis, OemSignal, OemVerdict, ProductCatalogEntry } from "./types";

/** ブランドを持たない/OEM とみなす表記。 */
const OEM_BRANDS = new Set(["", "oem", "no brand", "ノーブランド", "ノーブランド品"]);

/** シグナル重み（合計 1.0）。 */
const WEIGHTS = {
  noBrand: 0.3,
  oemMatchType: 0.25,
  largePriceGap: 0.2,
  massProduction: 0.15,
  weakBrandSignal: 0.1,
} as const;

const MASS_PRODUCTION_COMPETITORS = 100;
const LARGE_PRICE_GAP = 1.0;
const WEAK_BRAND_CONFIDENCE = 80;

export function isOemBrand(brand: string): boolean {
  return OEM_BRANDS.has(brand.trim().toLowerCase());
}

function oemMatchFactor(matchType: MatchType): number {
  if (matchType === "OEM_CANDIDATE") return 1.0;
  if (matchType === "SIMILAR") return 0.6;
  return 0.0;
}

function verdictOf(score: number): OemVerdict {
  if (score >= 65) return "likely";
  if (score >= 40) return "possible";
  return "unlikely";
}

/** 1 商品の OEM 可能性を分析する。 */
export function analyzeOem(entry: ProductCatalogEntry): OemAnalysis {
  const noBrand = isOemBrand(entry.brand);
  const gap = priceGapRate(entry);

  const factors = {
    noBrand: noBrand ? 1.0 : 0.0,
    oemMatchType: oemMatchFactor(entry.matchType),
    largePriceGap: clamp01(gap / 2),
    massProduction: clamp01(entry.china.competitors / 200),
    weakBrandSignal: clamp01((100 - entry.matchConfidence) / 100),
  };
  const weighted = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce(
    (sum, key) => sum + WEIGHTS[key] * factors[key],
    0,
  );
  const score = Math.round(clamp01(weighted) * 100);

  const signals: OemSignal[] = [];
  if (noBrand) signals.push("noBrand");
  if (entry.matchType === "OEM_CANDIDATE" || entry.matchType === "SIMILAR") signals.push("oemMatchType");
  if (gap >= LARGE_PRICE_GAP) signals.push("largePriceGap");
  if (entry.china.competitors >= MASS_PRODUCTION_COMPETITORS) signals.push("massProduction");
  if (entry.matchConfidence < WEAK_BRAND_CONFIDENCE) signals.push("weakBrandSignal");

  return {
    productId: entry.id,
    score,
    verdict: verdictOf(score),
    supplyStability: SUPPLY_STABILITY[entry.matchType],
    signals,
  };
}
