/**
 * ブランド・競合分析（Phase 2、docs/development_plan.md セクション 41）。
 *
 * backend/app/brands.py と同一の集計・段階化を移植し、API 未接続のモックでも同じ
 * ブランド別統計を返す（整合性の原則: セクション 93）。
 */

import { pyRound } from "./history";
import { isOemBrand } from "./oem";
import { evaluate } from "./opportunity-engine";
import type { BrandStat, CompetitionLevel, ProductCatalogEntry, TradeDirection } from "./types";

const LOW_COMPETITION = 40;
const MEDIUM_COMPETITION = 100;

function competitionLevel(avgCompetitors: number): CompetitionLevel {
  if (avgCompetitors <= LOW_COMPETITION) return "low";
  if (avgCompetitors <= MEDIUM_COMPETITION) return "medium";
  return "high";
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** Python の round(value, digits)（偶数丸め）に一致させる。 */
function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return pyRound(value * factor) / factor;
}

/** ブランド別の集計を推定利益合計の降順で返す。 */
export function brandAnalysis(entries: ProductCatalogEntry[]): BrandStat[] {
  const byBrand = new Map<string, ProductCatalogEntry[]>();
  for (const entry of entries) {
    const list = byBrand.get(entry.brand) ?? [];
    list.push(entry);
    byBrand.set(entry.brand, list);
  }

  const stats: BrandStat[] = [];
  for (const [brand, items] of byBrand) {
    const evaluations = items.map((e) => evaluate(e).best);
    const sellCompetitors = items.map((e, i) =>
      evaluations[i].direction === "CN_TO_JP" ? e.japan.competitors : e.china.competitors,
    );
    const exportCount = evaluations.filter((b) => b.direction === "JP_TO_CN").length;
    const importCount = evaluations.length - exportCount;
    let dominant: TradeDirection | null = null;
    if (exportCount > importCount) dominant = "JP_TO_CN";
    else if (importCount > exportCount) dominant = "CN_TO_JP";

    const avgCompetitors = round(mean(sellCompetitors));
    stats.push({
      brand,
      productCount: items.length,
      avgScore: round(mean(evaluations.map((b) => b.score))),
      avgMarginRate: round(mean(evaluations.map((b) => b.economics.marginRate)), 4),
      totalEstimatedProfit: evaluations.reduce((sum, b) => sum + b.economics.estimatedProfit, 0),
      avgCompetitors,
      competitionLevel: competitionLevel(avgCompetitors),
      oemShare: round(items.filter((e) => isOemBrand(e.brand)).length / items.length, 4),
      dominantDirection: dominant,
    });
  }

  return stats.sort((a, b) => b.totalEstimatedProfit - a.totalEstimatedProfit);
}
