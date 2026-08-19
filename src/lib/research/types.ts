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
