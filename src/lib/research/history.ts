/**
 * 価格・需要の合成時系列（Phase 2、docs/development_plan.md セクション 41・47）。
 *
 * backend/app/history.py と同一の生成式（FNV-1a 由来の決定論的擬似乱数）を移植し、
 * API 未接続のモックでもバックエンドのシード履歴と同一のチャートを描く（整合性の原則）。
 * ASCII キーのみを用いるため Python の utf-8 バイト列と一致する。
 */

/** 季節ピークの代表月（backend の _PEAK_MONTH と一致、AllYear は季節成分なし）。 */
const PEAK_MONTH: Record<string, number> = { Spring: 4, Summer: 7, Autumn: 10, Winter: 12 };

/** 生成する履歴の点数（か月）。最新点は現在値に一致させる。 */
export const HISTORY_MONTHS = 12;

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;
const TWO_POW_32 = 4294967296;

/** FNV-1a 32bit ハッシュ（ASCII キー前提。Python 実装と一致）。 */
function fnv1a(key: string): number {
  let h = FNV_OFFSET;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/** キーから [-1, 1) の決定論的擬似乱数を返す。 */
function unitNoise(key: string): number {
  return (fnv1a(key) / TWO_POW_32) * 2 - 1;
}

/** Python の round（偶数丸め）に一致させる。連続値のため通常は Math.round と同値。 */
export function pyRound(x: number): number {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

/** 月と季節性から [-1, 1] の季節成分を返す。ピーク月で +1、対極で -1。 */
export function seasonalComponent(month: number, seasonality: string): number {
  const peak = PEAK_MONTH[seasonality];
  if (peak === undefined) return 0;
  const raw = Math.abs(month - peak);
  const distance = Math.min(raw, 12 - raw);
  return (3 - distance) / 3;
}

/** (year, month) を delta か月ずらす（month は 1-12）。 */
export function shiftMonth(year: number, month: number, delta: number): [number, number] {
  const index = year * 12 + (month - 1) + delta;
  return [Math.floor(index / 12), (index % 12) + 1];
}

/** 時系列 1 点。 */
export interface SeriesPoint {
  year: number;
  month: number;
  price: number;
  demand: number;
}

/** 過去 months か月分の価格・需要時系列を決定論的に生成する（最新＝現在値）。 */
export function syntheticSeries(
  productId: string,
  market: string,
  currentPrice: number,
  currentDemand: number,
  seasonality: string,
  nowYear: number,
  nowMonth: number,
  months = HISTORY_MONTHS,
): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  const last = months - 1;
  for (let i = 0; i < months; i++) {
    const agesAgo = last - i;
    const [year, month] = shiftMonth(nowYear, nowMonth, -agesAgo);
    if (i === last) {
      points.push({ year, month, price: currentPrice, demand: currentDemand });
      continue;
    }
    const seasonal = seasonalComponent(month, seasonality);
    const drift = 0.01 * agesAgo;
    const priceNoise = unitNoise(`${productId}:${market}:P:${i}`) * 0.05;
    const price = pyRound(currentPrice * (1 - drift + seasonal * 0.08 + priceNoise));

    const demandNoise = unitNoise(`${productId}:${market}:D:${i}`) * 6;
    const demand = Math.max(0, Math.min(100, pyRound(currentDemand + seasonal * 12 + demandNoise)));
    points.push({ year, month, price: Math.max(1, price), demand });
  }
  return points;
}

/** SeriesPoint の年月を "YYYY-MM" 文字列にする。 */
export function ymOf(year: number, month: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}
