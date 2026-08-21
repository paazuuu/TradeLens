/**
 * 価格予測・需要予測（Phase 2、docs/development_plan.md セクション 41・88）。
 *
 * backend/app/forecast.py と同一の統計手法（最小二乗トレンド + 季節成分）を移植する。
 * AI ではなく決定論的に確定し、R² ベースの信頼度を併記する（原則: セクション 93）。
 */

import { pyRound, seasonalComponent, shiftMonth } from "./history";

/** 予測する先の月数。 */
export const FORECAST_MONTHS = 6;

/** 予測時系列の内部表現。 */
export interface ForecastResultPoint {
  year: number;
  month: number;
  value: number;
}

/** 予測結果（傾き・信頼度付き）。 */
export interface ForecastResult {
  points: ForecastResultPoint[];
  slopePerMonth: number;
  confidence: number;
}

/** x=0..n-1 に対する最小二乗直線 (slope, intercept, r²) を返す。 */
export function linearFit(values: number[]): [number, number, number] {
  const n = values.length;
  if (n < 2) return [0, values[0] ?? 0, 0];
  const xs = Array.from({ length: n }, (_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  const sxx = xs.reduce((acc, x) => acc + (x - meanX) ** 2, 0);
  const sxy = xs.reduce((acc, x, i) => acc + (x - meanX) * (values[i] - meanY), 0);
  const slope = sxx ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;
  const ssTot = values.reduce((acc, y) => acc + (y - meanY) ** 2, 0);
  const ssRes = values.reduce((acc, y, i) => acc + (y - (slope * i + intercept)) ** 2, 0);
  const rSquared = ssTot ? 1 - ssRes / ssTot : 0;
  return [slope, intercept, Math.max(0, rSquared)];
}

function runForecast(
  values: number[],
  seasonality: string,
  lastYear: number,
  lastMonth: number,
  seasonalAmplitude: number,
  horizon: number,
  lower: number,
  upper: number | null,
): ForecastResult {
  const [slope, intercept, rSquared] = linearFit(values);
  const n = values.length;
  const points: ForecastResultPoint[] = [];
  for (let step = 1; step <= horizon; step++) {
    const [year, month] = shiftMonth(lastYear, lastMonth, step);
    const trend = slope * (n - 1 + step) + intercept;
    const seasonal = seasonalComponent(month, seasonality) * seasonalAmplitude;
    let value = pyRound(trend + seasonal);
    value = Math.max(lower, value);
    if (upper !== null) value = Math.min(upper, value);
    points.push({ year, month, value });
  }
  return { points, slopePerMonth: Math.round(slope * 100) / 100, confidence: Math.round(rSquared * 100) };
}

/** 価格の先読み。季節振幅は直近価格の 8%。 */
export function forecastPrice(
  prices: number[],
  seasonality: string,
  lastYear: number,
  lastMonth: number,
  horizon = FORECAST_MONTHS,
): ForecastResult {
  const amplitude = prices.length ? prices[prices.length - 1] * 0.08 : 0;
  return runForecast(prices, seasonality, lastYear, lastMonth, amplitude, horizon, 1, null);
}

/** 需要指数の先読み。0-100 にクランプ、季節振幅は 12 ポイント。 */
export function forecastDemand(
  demand: number[],
  seasonality: string,
  lastYear: number,
  lastMonth: number,
  horizon = FORECAST_MONTHS,
): ForecastResult {
  return runForecast(demand, seasonality, lastYear, lastMonth, 12, horizon, 0, 100);
}
