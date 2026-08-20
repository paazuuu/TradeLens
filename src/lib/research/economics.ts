/**
 * Profit Engine（決定論的コスト計算、docs/development_plan.md セクション 10・93）。
 *
 * 販売市場・仕入市場の価格からサイズ帯に応じた送料等を控除し、総コストベースの
 * 推定利益を算出する。AI ではなくルールエンジンで数値を確定させる（原則: セクション 93）。
 * MVP のパラメータは暫定値。Settings（UI-012）でユーザーが調整可能にする想定。
 */

import type { CostBreakdown, Economics, ProductCatalogEntry, ReasonCode, SizeTier, TradeDirection } from "./types";

/** サイズ帯ごとの国際送料（円）。 */
const INTL_SHIPPING: Record<SizeTier, number> = { S: 800, M: 1600, L: 3200 };
/** サイズ帯ごとの国内送料（円）。 */
const DOMESTIC_SHIPPING: Record<SizeTier, number> = { S: 500, M: 700, L: 1200 };
/** サイズ帯ごとの梱包費（円）。 */
const PACKAGING: Record<SizeTier, number> = { S: 150, M: 250, L: 450 };
/** 関税・輸入諸税の簡易率（仕入価格に対して）。 */
const IMPORT_TAX_RATE = 0.05;
/** 販売プラットフォーム手数料率（販売価格に対して）。 */
const PLATFORM_FEE_RATE = 0.1;
/** 決済・為替バッファ等その他費用率（販売価格に対して）。 */
const OTHER_RATE = 0.02;

/**
 * 指定方向の総コストと利益を算出する。
 * CN_TO_JP: 中国で仕入れ日本で販売、JP_TO_CN: 日本で仕入れ中国で販売。
 */
export function deriveEconomicsFor(entry: ProductCatalogEntry, direction: TradeDirection): Economics {
  const isImport = direction === "CN_TO_JP";
  const sellPrice = isImport ? entry.japan.price : entry.china.price;
  const purchasePrice = isImport ? entry.china.price : entry.japan.price;

  const cost: CostBreakdown = {
    purchasePrice,
    intlShipping: INTL_SHIPPING[entry.sizeTier],
    domesticShipping: DOMESTIC_SHIPPING[entry.sizeTier],
    importTax: Math.round(purchasePrice * IMPORT_TAX_RATE),
    platformFee: Math.round(sellPrice * PLATFORM_FEE_RATE),
    packaging: PACKAGING[entry.sizeTier],
    other: Math.round(sellPrice * OTHER_RATE),
  };

  const totalCost =
    cost.purchasePrice +
    cost.intlShipping +
    cost.domesticShipping +
    cost.importTax +
    cost.platformFee +
    cost.packaging +
    cost.other;

  const estimatedProfit = sellPrice - totalCost;
  const marginRate = sellPrice > 0 ? estimatedProfit / sellPrice : 0;
  const roi = totalCost > 0 ? estimatedProfit / totalCost : 0;

  return { sellPrice, cost, totalCost, estimatedProfit, marginRate, roi, breakEvenSellPrice: totalCost };
}

/** エントリ既定方向の利益（後方互換）。 */
export function deriveEconomics(entry: ProductCatalogEntry): Economics {
  return deriveEconomicsFor(entry, entry.bestDirection);
}

/** 日中価格差率。(高い側 - 低い側) / 低い側。 */
export function priceGapRate(entry: ProductCatalogEntry): number {
  const high = Math.max(entry.japan.price, entry.china.price);
  const low = Math.min(entry.japan.price, entry.china.price);
  return low > 0 ? (high - low) / low : 0;
}

/**
 * 有望理由を導出する（AI 説明の根拠、セクション 10 原則・UI-005）。
 * 閾値ベースで該当する理由コードを返す。表示文言は i18n 辞書側で解決する。
 */
export function deriveReasons(
  entry: ProductCatalogEntry,
  direction: TradeDirection,
  economics: Economics,
): ReasonCode[] {
  const reasons: ReasonCode[] = [];
  const sellMarket = direction === "CN_TO_JP" ? entry.japan : entry.china;

  if (economics.marginRate >= 0.25) reasons.push("highMargin");
  if (priceGapRate(entry) >= 1) reasons.push("priceGap");
  if (sellMarket.competitors <= 40) reasons.push("lowCompetition");
  if (sellMarket.demandIndex >= 70) reasons.push("demandRising");
  if (entry.seasonality !== "AllYear") reasons.push("seasonalPeak");
  if (entry.matchType === "EXACT" || entry.matchType === "MODEL_MATCH") reasons.push("stableSupply");
  if (entry.risk === "High") reasons.push("highRisk");

  return reasons;
}

/**
 * データ信頼度の内訳（セクション 95）。マッチ信頼度は生データ、価格・利益信頼度は
 * 競合数・利益率から簡易に導出する。実データ接続後に取得元の質で補正する想定。
 */
export function deriveConfidence(entry: ProductCatalogEntry, direction: TradeDirection, economics: Economics) {
  const sellMarket = direction === "CN_TO_JP" ? entry.japan : entry.china;
  const price = Math.max(40, Math.min(98, 100 - sellMarket.competitors));
  const profit = Math.max(40, Math.min(98, Math.round(60 + economics.marginRate * 120)));
  return { match: entry.matchConfidence, price, profit };
}
