/**
 * CrossBorder Opportunity AI（日中越境商品リサーチAI）の共有ドメインモデル。
 *
 * docs/development_plan.md のセクション 7（商品マッチング）、10（実質利益）、
 * 11（Opportunity Score）、12（商流方向）、58（Opportunity Ranking）、
 * 95（信頼性表示）に対応する。
 *
 * 数値はすべて基準通貨 JPY（円）で保持する。中国価格は為替換算後の
 * 円建て相当額（normalized_price）を格納し、元の通貨・原価は別途持つ。
 */

/** 商流方向。日本→中国 / 中国→日本 の 2 方向。 */
export type TradeDirection = "JP_TO_CN" | "CN_TO_JP";

/** 季節性。国別の需要時期は将来拡張。まずは代表シーズンで表現する。 */
export type Season = "Spring" | "Summer" | "Autumn" | "Winter" | "AllYear";

/** 商品リスク評価（規制・破損・偽物リスク等の総合、セクション 18）。 */
export type RiskLevel = "Low" | "Medium" | "High";

/** 商品マッチタイプ（セクション 7）。 */
export type MatchType = "EXACT" | "BRAND_MATCH" | "MODEL_MATCH" | "SIMILAR" | "OEM_CANDIDATE" | "UNMATCHED";

/** データ信頼度のティア（セクション 95）。 */
export type ConfidenceTier = "High" | "Medium" | "Low";

/**
 * 1 商品の越境商機を表す 1 行。Opportunity Ranking / Dashboard / Product Detail が
 * 共通で参照する。数値は Rule Engine による決定論的計算結果（セクション 93）。
 */
export interface Opportunity {
  id: string;
  /** 商品名（日本語表記を基本とする）。 */
  name: string;
  /** ブランド名。ノーブランド / OEM は "OEM" 等で表す。 */
  brand: string;
  /** 大カテゴリー（例: キャンプ用品）。 */
  category: string;
  /** サブカテゴリー / 商品タイプ（例: LEDランタン）。 */
  subCategory: string;
  /** 商品サムネイル URL。未取得時は undefined。 */
  imageUrl?: string;

  /** 最終判定された有望方向（Japan→China Score と China→Japan Score の高い方）。 */
  bestDirection: TradeDirection;
  /** 日本市場の代表販売価格（円）。 */
  japanPrice: number;
  /** 中国市場の代表販売価格（為替換算後の円相当）。 */
  chinaPrice: number;
  /** 価格差率。(高い側 - 低い側) / 低い側。0.0〜。 */
  priceGapRate: number;

  /** 総コスト控除後の推定利益額（円、セクション 10）。 */
  estimatedProfit: number;
  /** 利益率 = 推定利益 / 販売価格。 */
  marginRate: number;

  /** 季節性。 */
  seasonality: Season;
  /** 商品リスク。 */
  risk: RiskLevel;

  /** Opportunity Score（0〜100、セクション 11）。有望方向側のスコア。 */
  score: number;

  /** 商品マッチタイプ。 */
  matchType: MatchType;
  /** マッチ信頼度（0〜100%）。 */
  matchConfidence: number;
}

/** 商品サイズ帯。国際送料・梱包費の算定に用いる。 */
export type SizeTier = "S" | "M" | "L";

/** 片方の市場スナップショット（UI-005 の日中比較）。 */
export interface MarketSnapshot {
  /** 代表販売価格（円）。 */
  price: number;
  /** 競合出品者数。 */
  competitors: number;
  /** 需要指数（0〜100）。 */
  demandIndex: number;
  /** レビュー数。 */
  reviewCount: number;
}

/** 総コストの内訳（円、セクション 10）。 */
export interface CostBreakdown {
  purchasePrice: number;
  intlShipping: number;
  domesticShipping: number;
  importTax: number;
  platformFee: number;
  packaging: number;
  other: number;
}

/** コストベースの利益指標（Profit Engine の出力、セクション 10）。 */
export interface Economics {
  sellPrice: number;
  cost: CostBreakdown;
  totalCost: number;
  estimatedProfit: number;
  marginRate: number;
  roi: number;
  /** 損益分岐となる販売価格（＝総コスト）。 */
  breakEvenSellPrice: number;
}

/** AI 有望理由コード（セクション 10 原則・UI-005 の AI 説明）。 */
export type ReasonCode =
  | "highMargin"
  | "priceGap"
  | "lowCompetition"
  | "demandRising"
  | "seasonalPeak"
  | "stableSupply"
  | "highRisk";

/** データ信頼度の内訳（セクション 95）。 */
export interface ConfidenceBreakdown {
  match: number;
  price: number;
  profit: number;
}

/**
 * 商品カタログの生データ（Mock）。市場スナップショットとサイズ帯を持ち、
 * ここから Opportunity 要約と ProductDetail を決定論的に導出する。
 */
export interface ProductCatalogEntry {
  id: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  model: string;
  imageUrl?: string;
  sizeTier: SizeTier;
  bestDirection: TradeDirection;
  seasonality: Season;
  risk: RiskLevel;
  matchType: MatchType;
  matchConfidence: number;
  score: number;
  japan: MarketSnapshot;
  china: MarketSnapshot;
}

/** 月次時系列の 1 点（価格履歴、Phase 2）。date は "YYYY-MM"。 */
export interface TimeSeriesPoint {
  date: string;
  price: number;
  demand: number;
}

/** 商品 1 件の日中価格・需要履歴（Phase 2）。 */
export interface PriceHistory {
  productId: string;
  japan: TimeSeriesPoint[];
  china: TimeSeriesPoint[];
}

/** 予測時系列の 1 点（Phase 2）。 */
export interface ForecastPoint {
  date: string;
  value: number;
}

/** 1 系列の予測結果（トレンド傾き・信頼度付き、Phase 2）。 */
export interface ForecastSeries {
  points: ForecastPoint[];
  /** 1 か月あたりの変化量（円 or 指数）。 */
  slopePerMonth: number;
  /** 0-100。トレンドの当てはまり（決定係数 R² ベース）。 */
  confidence: number;
}

/** 価格予測・需要予測（有望方向の販売市場基準、Phase 2）。 */
export interface ProductForecast {
  productId: string;
  /** 予測対象の販売市場（JP / CN）。 */
  market: string;
  bestDirection: TradeDirection;
  priceForecast: ForecastSeries;
  demandForecast: ForecastSeries;
}

/** OEM 分析のシグナルコード（Phase 2）。 */
export type OemSignal = "noBrand" | "oemMatchType" | "largePriceGap" | "massProduction" | "weakBrandSignal";

/** OEM 可能性の判定。 */
export type OemVerdict = "likely" | "possible" | "unlikely";

/** 1 商品の OEM 可能性分析（Phase 2）。 */
export interface OemAnalysis {
  productId: string;
  /** 0-100（OEM 可能性）。 */
  score: number;
  verdict: OemVerdict;
  /** 0-1（供給安定性）。 */
  supplyStability: number;
  signals: OemSignal[];
}

/** 類似・代替候補 1 件（Phase 2）。 */
export interface SimilarProduct {
  id: string;
  name: string;
  brand: string;
  subCategory: string;
  /** 0-100（類似度）。 */
  similarity: number;
  bestDirection: TradeDirection;
  /** Opportunity Score。 */
  score: number;
  estimatedProfit: number;
}

/** 競合水準（Phase 2）。 */
export type CompetitionLevel = "low" | "medium" | "high";

/** ブランド別の集計（Phase 2）。 */
export interface BrandStat {
  brand: string;
  productCount: number;
  avgScore: number;
  avgMarginRate: number;
  totalEstimatedProfit: number;
  avgCompetitors: number;
  competitionLevel: CompetitionLevel;
  /** 0-1（OEM 比率）。 */
  oemShare: number;
  dominantDirection: TradeDirection | null;
}

/** UI-005 が表示する 1 商品の詳細。 */
export interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  model: string;
  imageUrl?: string;
  bestDirection: TradeDirection;
  seasonality: Season;
  risk: RiskLevel;
  matchType: MatchType;
  matchConfidence: number;
  score: number;
  japan: MarketSnapshot;
  china: MarketSnapshot;
  priceGapRate: number;
  economics: Economics;
  reasons: ReasonCode[];
  confidence: ConfidenceBreakdown;
}
