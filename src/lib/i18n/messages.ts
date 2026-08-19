/**
 * UI 表示文言の辞書（日本語 / 中国語）。
 *
 * 画面のクロム（見出し・ラベル・ボタン等）を 2 言語で提供する。商品名・ブランド等の
 * 実データ（外部ソース由来）は翻訳対象外とし、データそのものを表示する（原則: セクション 94）。
 *
 * 型 Messages を単一の真実とし、各ロケールが同じ構造を満たすことをコンパイル時に保証する。
 */

import type { Locale } from "@/lib/preferences/locale";
import type { ResearchStageId } from "@/lib/research/research-flow";
import type { MatchType, RiskLevel, Season, TradeDirection } from "@/lib/research/types";

export interface Messages {
  common: {
    all: string;
    viewRanking: string;
    dataConfidence: string;
    high: string;
    medium: string;
    low: string;
  };
  language: {
    label: string;
    ja: string;
    zh: string;
  };
  pageHeaders: {
    opportunities: { title: string; description: string };
    research: { title: string; description: string };
    productDetail: { title: string; description: string };
  };
  opportunities: {
    rankingTitle: string;
    sortByScore: string;
    showingCount: (count: number) => string;
    empty: string;
    summary: {
      total: string;
      totalHint: (exportN: number, importN: number) => string;
      avgScore: string;
      avgScoreHint: string;
      avgMargin: string;
      avgMarginHint: (avgProfit: string) => string;
      bidirectional: string;
      bidirectionalHint: string;
    };
    columns: {
      product: string;
      direction: string;
      japanPrice: string;
      chinaPrice: string;
      priceGap: string;
      profit: string;
      margin: string;
      season: string;
      risk: string;
      match: string;
      confidence: (value: number) => string;
      score: string;
    };
  };
  research: {
    formTitle: string;
    formDescription: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    directionLegend: string;
    includeLegend: string;
    includeSeasonal: string;
    includeOem: string;
    includeSimilar: string;
    minMargin: string;
    minScore: string;
    start: string;
    directionBoth: string;
    stageNames: Record<ResearchStageId, string>;
    runningTitle: string;
    runningDescription: (category: string) => string;
    progress: string;
    resultTitle: string;
    resultDescription: (category: string, analyzed: string, found: string) => string;
    statsAnalyzed: string;
    statsFound: string;
    statsJpToCn: string;
    statsCnToJp: string;
    reset: string;
    viewOpportunities: string;
  };
  productDetail: {
    notFound: string;
    backToRanking: string;
    model: string;
    matchScore: string;
    opportunityScore: string;
    japanMarket: string;
    chinaMarket: string;
    salesPrice: string;
    competitors: string;
    demand: string;
    reviews: string;
    profitTitle: string;
    profitDescription: string;
    purchasePrice: string;
    intlShipping: string;
    domesticShipping: string;
    importTax: string;
    platformFee: string;
    packaging: string;
    other: string;
    totalCost: string;
    sellPrice: string;
    estimatedProfit: string;
    margin: string;
    roi: string;
    breakEven: string;
    aiTitle: string;
    aiDescription: string;
    confidenceMatch: string;
    confidencePrice: string;
    confidenceProfit: string;
  };
  labels: {
    directionShort: Record<TradeDirection, string>;
    direction: Record<TradeDirection, string>;
    season: Record<Season, string>;
    risk: Record<RiskLevel, string>;
    matchType: Record<MatchType, string>;
  };
  reasons: Record<
    "highMargin" | "priceGap" | "lowCompetition" | "demandRising" | "seasonalPeak" | "stableSupply" | "highRisk",
    string
  >;
}

const ja: Messages = {
  common: {
    all: "すべて",
    viewRanking: "ランキングを見る",
    dataConfidence: "データ信頼度",
    high: "高",
    medium: "中",
    low: "低",
  },
  language: { label: "言語", ja: "日本語", zh: "中文" },
  pageHeaders: {
    opportunities: {
      title: "Opportunities",
      description:
        "Opportunity Score 順の有望商品ランキング。価格差だけでなく総コストベースの推定利益と商流方向で評価する。",
    },
    research: {
      title: "AI Research",
      description:
        "カテゴリーを入力して越境商品リサーチを開始します。AI がカテゴリー分解から Opportunity Score までを自動処理します。",
    },
    productDetail: {
      title: "Product Detail",
      description: "日本市場と中国市場の比較、総コストベースの利益内訳、AI による有望理由を表示します。",
    },
  },
  opportunities: {
    rankingTitle: "Opportunity Ranking",
    sortByScore: "Score順",
    showingCount: (count) => `${count} 件の商機を表示中`,
    empty: "該当する商機がありません。",
    summary: {
      total: "有望商品数",
      totalHint: (exportN, importN) => `日→中 ${exportN} ・ 中→日 ${importN}`,
      avgScore: "平均 Opportunity Score",
      avgScoreHint: "有望方向側の平均",
      avgMargin: "平均利益率",
      avgMarginHint: (avgProfit) => `平均推定利益 ${avgProfit}`,
      bidirectional: "双方向カバー",
      bidirectionalHint: "日→中 / 中→日",
    },
    columns: {
      product: "商品",
      direction: "方向",
      japanPrice: "日本価格",
      chinaPrice: "中国価格",
      priceGap: "価格差",
      profit: "推定利益",
      margin: "利益率",
      season: "季節",
      risk: "リスク",
      match: "マッチ",
      confidence: (value) => `信頼度 ${value}%`,
      score: "Score",
    },
  },
  research: {
    formTitle: "AI 商品リサーチ",
    formDescription: "カテゴリーを入力すると、AI が日本市場と中国市場を横断して越境の商機を調査します。",
    categoryLabel: "何を探しますか？",
    categoryPlaceholder: "例: キャンプ用品",
    directionLegend: "対象の商流方向",
    includeLegend: "調査対象に含めるもの",
    includeSeasonal: "季節商品を含める",
    includeOem: "OEM候補を含める",
    includeSimilar: "類似商品を含める",
    minMargin: "最低利益率",
    minScore: "最低 Opportunity Score",
    start: "AI リサーチ開始",
    directionBoth: "両方向",
    stageNames: {
      category: "カテゴリー解析",
      discovery: "商品候補取得",
      japan: "日本市場調査",
      china: "中国市場調査",
      matching: "商品マッチング",
      fx: "為替換算",
      cost: "コスト計算",
      seasonality: "季節性分析",
      score: "Opportunity Score 計算",
    },
    runningTitle: "リサーチ実行中",
    runningDescription: (category) => `「${category}」を分析しています。AI が各段階を順に処理します。`,
    progress: "進捗",
    resultTitle: "リサーチ完了",
    resultDescription: (category, analyzed, found) =>
      `「${category}」について ${analyzed} 商品を分析し、${found} 件の有望候補が見つかりました。`,
    statsAnalyzed: "分析商品数",
    statsFound: "有望商品数",
    statsJpToCn: "日本 → 中国",
    statsCnToJp: "中国 → 日本",
    reset: "条件を変えて再検索",
    viewOpportunities: "有望商品ランキングを見る",
  },
  productDetail: {
    notFound: "商品が見つかりませんでした。",
    backToRanking: "ランキングに戻る",
    model: "型番",
    matchScore: "Match Score",
    opportunityScore: "Opportunity Score",
    japanMarket: "日本市場",
    chinaMarket: "中国市場",
    salesPrice: "販売価格",
    competitors: "競合数",
    demand: "需要指数",
    reviews: "レビュー数",
    profitTitle: "利益シミュレーション",
    profitDescription: "総コストベースの推定利益。単純な価格差ではなく、送料・税・手数料を控除して算出する。",
    purchasePrice: "仕入価格",
    intlShipping: "国際送料",
    domesticShipping: "国内送料",
    importTax: "関税・税等",
    platformFee: "販売手数料",
    packaging: "梱包費",
    other: "その他費用",
    totalCost: "総コスト",
    sellPrice: "販売価格",
    estimatedProfit: "推定利益",
    margin: "利益率",
    roi: "ROI",
    breakEven: "損益分岐価格",
    aiTitle: "AI による有望理由",
    aiDescription: "AI の判断根拠を提示します。最終的な販売可否は各国の法令・規約を確認してください。",
    confidenceMatch: "マッチ信頼度",
    confidencePrice: "価格信頼度",
    confidenceProfit: "利益信頼度",
  },
  labels: {
    directionShort: { JP_TO_CN: "日→中", CN_TO_JP: "中→日" },
    direction: { JP_TO_CN: "日本 → 中国", CN_TO_JP: "中国 → 日本" },
    season: { Spring: "春", Summer: "夏", Autumn: "秋", Winter: "冬", AllYear: "通年" },
    risk: { Low: "低", Medium: "中", High: "高" },
    matchType: {
      EXACT: "完全一致",
      BRAND_MATCH: "ブランド一致",
      MODEL_MATCH: "モデル一致",
      SIMILAR: "高類似",
      OEM_CANDIDATE: "OEM候補",
      UNMATCHED: "比較対象なし",
    },
  },
  reasons: {
    highMargin: "総コスト控除後でも利益率が高い",
    priceGap: "日中の価格差が大きい",
    lowCompetition: "販売先市場の競合が少ない",
    demandRising: "販売先市場で需要が上昇している",
    seasonalPeak: "季節需要のピークが近い",
    stableSupply: "仕入れが安定しており調達しやすい",
    highRisk: "規制・輸送リスクが高いため確認が必要",
  },
};

const zh: Messages = {
  common: { all: "全部", viewRanking: "查看排行", dataConfidence: "数据可信度", high: "高", medium: "中", low: "低" },
  language: { label: "语言", ja: "日语", zh: "中文" },
  pageHeaders: {
    opportunities: {
      title: "商机排行",
      description: "按 Opportunity Score 排序的优质商品排行。不仅看价差，还结合全成本估算利润与贸易方向进行评估。",
    },
    research: {
      title: "AI 调研",
      description: "输入品类即可开始跨境商品调研。AI 将自动完成从品类拆解到 Opportunity Score 的全流程。",
    },
    productDetail: {
      title: "商品详情",
      description: "展示日本市场与中国市场的对比、基于全成本的利润明细，以及 AI 判定的商机理由。",
    },
  },
  opportunities: {
    rankingTitle: "商机排行",
    sortByScore: "按 Score 排序",
    showingCount: (count) => `正在显示 ${count} 条商机`,
    empty: "没有符合条件的商机。",
    summary: {
      total: "优质商品数",
      totalHint: (exportN, importN) => `日→中 ${exportN} ・ 中→日 ${importN}`,
      avgScore: "平均 Opportunity Score",
      avgScoreHint: "优势方向的平均值",
      avgMargin: "平均利润率",
      avgMarginHint: (avgProfit) => `平均预估利润 ${avgProfit}`,
      bidirectional: "双向覆盖",
      bidirectionalHint: "日→中 / 中→日",
    },
    columns: {
      product: "商品",
      direction: "方向",
      japanPrice: "日本价格",
      chinaPrice: "中国价格",
      priceGap: "价差",
      profit: "预估利润",
      margin: "利润率",
      season: "季节",
      risk: "风险",
      match: "匹配",
      confidence: (value) => `可信度 ${value}%`,
      score: "Score",
    },
  },
  research: {
    formTitle: "AI 商品调研",
    formDescription: "输入品类后，AI 将横跨日本市场与中国市场，调研跨境商机。",
    categoryLabel: "您想找什么？",
    categoryPlaceholder: "例如：露营用品",
    directionLegend: "目标贸易方向",
    includeLegend: "调研范围包含",
    includeSeasonal: "包含季节商品",
    includeOem: "包含 OEM 候选",
    includeSimilar: "包含相似商品",
    minMargin: "最低利润率",
    minScore: "最低 Opportunity Score",
    start: "开始 AI 调研",
    directionBoth: "双向",
    stageNames: {
      category: "品类解析",
      discovery: "获取候选商品",
      japan: "日本市场调研",
      china: "中国市场调研",
      matching: "商品匹配",
      fx: "汇率换算",
      cost: "成本计算",
      seasonality: "季节性分析",
      score: "Opportunity Score 计算",
    },
    runningTitle: "调研进行中",
    runningDescription: (category) => `正在分析「${category}」。AI 将按顺序处理各个阶段。`,
    progress: "进度",
    resultTitle: "调研完成",
    resultDescription: (category, analyzed, found) =>
      `针对「${category}」分析了 ${analyzed} 件商品，发现 ${found} 条优质商机。`,
    statsAnalyzed: "分析商品数",
    statsFound: "优质商品数",
    statsJpToCn: "日本 → 中国",
    statsCnToJp: "中国 → 日本",
    reset: "调整条件重新搜索",
    viewOpportunities: "查看优质商品排行",
  },
  productDetail: {
    notFound: "未找到该商品。",
    backToRanking: "返回排行",
    model: "型号",
    matchScore: "Match Score",
    opportunityScore: "Opportunity Score",
    japanMarket: "日本市场",
    chinaMarket: "中国市场",
    salesPrice: "销售价格",
    competitors: "竞争卖家",
    demand: "需求指数",
    reviews: "评价数",
    profitTitle: "利润模拟",
    profitDescription: "基于全成本的预估利润。不是简单的价差，而是扣除运费、税金与手续费后计算得出。",
    purchasePrice: "进货价格",
    intlShipping: "国际运费",
    domesticShipping: "国内运费",
    importTax: "关税与税金",
    platformFee: "销售手续费",
    packaging: "包装费",
    other: "其他费用",
    totalCost: "总成本",
    sellPrice: "销售价格",
    estimatedProfit: "预估利润",
    margin: "利润率",
    roi: "ROI",
    breakEven: "盈亏平衡价",
    aiTitle: "AI 判定的商机理由",
    aiDescription: "展示 AI 的判断依据。最终能否销售，请核对各国法规与平台规则。",
    confidenceMatch: "匹配可信度",
    confidencePrice: "价格可信度",
    confidenceProfit: "利润可信度",
  },
  labels: {
    directionShort: { JP_TO_CN: "日→中", CN_TO_JP: "中→日" },
    direction: { JP_TO_CN: "日本 → 中国", CN_TO_JP: "中国 → 日本" },
    season: { Spring: "春", Summer: "夏", Autumn: "秋", Winter: "冬", AllYear: "全年" },
    risk: { Low: "低", Medium: "中", High: "高" },
    matchType: {
      EXACT: "完全一致",
      BRAND_MATCH: "品牌一致",
      MODEL_MATCH: "型号一致",
      SIMILAR: "高相似",
      OEM_CANDIDATE: "OEM 候选",
      UNMATCHED: "无可比对象",
    },
  },
  reasons: {
    highMargin: "扣除全成本后利润率依然较高",
    priceGap: "日中之间价差较大",
    lowCompetition: "销售市场竞争较少",
    demandRising: "销售市场需求正在上升",
    seasonalPeak: "季节性需求高峰临近",
    stableSupply: "货源稳定，便于采购",
    highRisk: "监管与运输风险较高，需要确认",
  },
};

export const messages: Record<Locale, Messages> = { ja, zh };
