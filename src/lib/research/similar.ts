/**
 * 類似商品探索エンジン（Phase 2、docs/development_plan.md セクション 41）。
 *
 * backend/app/similar.py と同一の重み・文字バイグラム Jaccard を移植し、API 未接続の
 * モックでも同じ類似度・順序を返す（整合性の原則: セクション 93）。日本語は BMP 文字が
 * 中心で JS の文字単位と Python のコードポイントが一致するため結果が揃う。
 */

import { isOemBrand } from "./oem";
import { evaluate } from "./opportunity-engine";
import type { ProductCatalogEntry, SimilarProduct } from "./types";

/** シグナル重み（合計 1.0）。 */
const WEIGHTS = {
  subCategory: 0.4,
  nameOverlap: 0.25,
  category: 0.1,
  brandRel: 0.1,
  priceProximity: 0.1,
  size: 0.05,
} as const;

function bigrams(text: string): Set<string> {
  const cleaned = text.replace(/ /g, "").replace(/　/g, "");
  const set = new Set<string>();
  for (let i = 0; i < cleaned.length - 1; i++) set.add(cleaned.slice(i, i + 2));
  return set;
}

function nameOverlap(a: string, b: string): number {
  const ba = bigrams(a);
  const bb = bigrams(b);
  if (ba.size === 0 || bb.size === 0) return 0;
  let inter = 0;
  for (const gram of ba) if (bb.has(gram)) inter++;
  const union = ba.size + bb.size - inter;
  return union ? inter / union : 0;
}

function priceProximity(a: number, b: number): number {
  const top = Math.max(a, b);
  if (top <= 0) return 0;
  return 1 - Math.min(1, Math.abs(a - b) / top);
}

function brandRelation(a: ProductCatalogEntry, b: ProductCatalogEntry): number {
  if (isOemBrand(a.brand) && isOemBrand(b.brand)) return 1;
  return a.brand.trim().toLowerCase() === b.brand.trim().toLowerCase() ? 1 : 0;
}

function similarity(target: ProductCatalogEntry, candidate: ProductCatalogEntry): number {
  const factors = {
    subCategory: target.subCategory === candidate.subCategory ? 1 : 0,
    nameOverlap: nameOverlap(target.name, candidate.name),
    category: target.category === candidate.category ? 1 : 0,
    brandRel: brandRelation(target, candidate),
    priceProximity: priceProximity(target.japan.price, candidate.japan.price),
    size: target.sizeTier === candidate.sizeTier ? 1 : 0,
  };
  return (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce((sum, key) => sum + WEIGHTS[key] * factors[key], 0);
}

/** target に類似する商品を類似度降順で返す（自身を除く）。 */
export function findSimilar(target: ProductCatalogEntry, entries: ProductCatalogEntry[], limit = 5): SimilarProduct[] {
  const scored = entries
    .filter((candidate) => candidate.id !== target.id)
    .map((candidate) => ({ score: similarity(target, candidate), candidate }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ score, candidate }) => {
    const best = evaluate(candidate).best;
    return {
      id: candidate.id,
      name: candidate.name,
      brand: candidate.brand,
      subCategory: candidate.subCategory,
      similarity: Math.round(score * 100),
      bestDirection: best.direction,
      score: best.score,
      estimatedProfit: best.economics.estimatedProfit,
    };
  });
}
