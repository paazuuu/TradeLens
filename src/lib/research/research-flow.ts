/**
 * AI リサーチのフロー定義（UI-002 / UI-003、docs/development_plan.md セクション 25-26, 56-57, 71）。
 *
 * STEP 4 の段階では Backend を持たず、このモジュールが Mock API の役割を担う。
 * 実 API 接続時（STEP 5: POST /research, GET /research/{id}）に runMockResearch を
 * 差し替える。段階定義（researchStages）は進捗表示と共有する。
 */

import { mockOpportunities } from "./mock-data";
import type { TradeDirection } from "./types";

/** リサーチ対象の方向。両方向を含む。 */
export type ResearchDirection = TradeDirection | "BOTH";

/** リサーチフォームの入力値（UI-002）。 */
export interface ResearchOptions {
  category: string;
  direction: ResearchDirection;
  includeSeasonal: boolean;
  includeOem: boolean;
  includeSimilar: boolean;
  /** 最低利益率（%、0-100）。 */
  minMargin: number;
  /** 最低 Opportunity Score（0-100）。 */
  minScore: number;
}

/** フォームの初期値。 */
export const defaultResearchOptions: ResearchOptions = {
  category: "",
  direction: "BOTH",
  includeSeasonal: true,
  includeOem: true,
  includeSimilar: true,
  minMargin: 20,
  minScore: 70,
};

/** AI 処理の段階（UI-003）。表示順に並ぶ。 */
export const researchStages = [
  { id: "category", label: "Category Analysis", jp: "カテゴリー解析" },
  { id: "discovery", label: "Product Discovery", jp: "商品候補取得" },
  { id: "japan", label: "Japan Market", jp: "日本市場調査" },
  { id: "china", label: "China Market", jp: "中国市場調査" },
  { id: "matching", label: "Product Matching", jp: "商品マッチング" },
  { id: "fx", label: "FX Conversion", jp: "為替換算" },
  { id: "cost", label: "Cost Calculation", jp: "コスト計算" },
  { id: "seasonality", label: "Seasonality", jp: "季節性分析" },
  { id: "score", label: "Opportunity Score", jp: "Opportunity Score 計算" },
] as const;

export type ResearchStageId = (typeof researchStages)[number]["id"];

/** リサーチ結果サマリ（UI-003 完了表示）。 */
export interface ResearchResult {
  productsAnalyzed: number;
  opportunitiesFound: number;
  jpToCn: number;
  cnToJp: number;
}

/**
 * オプションからモック結果サマリを算出する。
 * モック商機データを方向・最低 Score・最低利益率で絞り込み、有望件数を求める。
 * productsAnalyzed は候補生成規模を表す代表値（絞り込み前の分析対象数）。
 */
export function computeMockResult(options: ResearchOptions): ResearchResult {
  const matched = mockOpportunities.filter((item) => {
    const directionOk = options.direction === "BOTH" ? true : item.bestDirection === options.direction;
    const scoreOk = item.score >= options.minScore;
    const marginOk = item.marginRate * 100 >= options.minMargin;
    const oemOk = options.includeOem || item.matchType !== "OEM_CANDIDATE";
    const similarOk = options.includeSimilar || item.matchType !== "SIMILAR";
    const seasonalOk = options.includeSeasonal || item.seasonality === "AllYear";
    return directionOk && scoreOk && marginOk && oemOk && similarOk && seasonalOk;
  });

  const jpToCn = matched.filter((item) => item.bestDirection === "JP_TO_CN").length;
  const cnToJp = matched.filter((item) => item.bestDirection === "CN_TO_JP").length;

  // 分析対象数はサブカテゴリー展開の規模を模した代表値（1 有望あたり十数候補を想定）。
  const productsAnalyzed = matched.length === 0 ? 0 : matched.length * 14 + 6;

  return { productsAnalyzed, opportunitiesFound: matched.length, jpToCn, cnToJp };
}
