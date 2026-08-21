/**
 * 画像比較（Phase 2、docs/development_plan.md セクション 41）。
 *
 * backend/app/images.py と同一の推定式を移植する。MVP は商品画像未取得のため、
 * マッチ信頼度・マッチタイプからの決定論的な推定値を返す（原則: セクション 93）。
 */

import { pyRound, unitNoise } from "./history";
import type { ImageComparison, ImageVerdict, MatchType, ProductCatalogEntry } from "./types";

const TYPE_ADJUST: Record<MatchType, number> = {
  EXACT: 6,
  MODEL_MATCH: 3,
  BRAND_MATCH: 0,
  OEM_CANDIDATE: -4,
  SIMILAR: -8,
  UNMATCHED: -20,
};

function clamp(low: number, high: number, value: number): number {
  return Math.max(low, Math.min(high, value));
}

function verdictOf(similarity: number): ImageVerdict {
  if (similarity >= 85) return "sameProduct";
  if (similarity >= 65) return "likelySame";
  return "different";
}

/** 日中出品の推定画像一致度を返す（画像未取得時のメタデータ推定）。 */
export function compareImages(entry: ProductCatalogEntry): ImageComparison {
  const adjust = TYPE_ADJUST[entry.matchType] ?? -10;
  const noise = unitNoise(`${entry.id}:image`) * 4;
  const similarity = clamp(0, 100, pyRound(entry.matchConfidence + adjust + noise));

  return {
    productId: entry.id,
    imagesAvailable: entry.imageUrl !== undefined,
    jpImageUrl: entry.imageUrl ?? null,
    cnImageUrl: null,
    similarity,
    verdict: verdictOf(similarity),
  };
}
