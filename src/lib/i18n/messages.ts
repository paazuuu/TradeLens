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
    dashboard: { title: string; description: string };
    opportunities: { title: string; description: string };
    research: { title: string; description: string };
    productDetail: { title: string; description: string };
    products: { title: string; description: string };
    markets: { title: string; description: string };
    seasonal: { title: string; description: string };
    analytics: { title: string; description: string };
    watchlists: { title: string; description: string };
    alerts: { title: string; description: string };
    settings: { title: string; description: string };
  };
  watchlists: {
    categoriesTitle: string;
    productsTitle: string;
    addCategory: string;
    addPlaceholder: string;
    remove: string;
    emptyCategories: string;
    emptyProducts: string;
  };
  alerts: {
    newOpportunity: string;
    seasonApproaching: string;
    reasonsLabel: string;
    recommendedResearch: string;
    empty: string;
  };
  settings: {
    fxTitle: string;
    costTitle: string;
    thresholdTitle: string;
    notificationTitle: string;
    exchangeRate: string;
    exchangeRateHint: string;
    intlShipping: string;
    domesticShipping: string;
    importTaxRate: string;
    platformFeeRate: string;
    minMargin: string;
    minScore: string;
    emailAlerts: string;
    monitorFrequency: string;
    frequency: Record<"daily" | "weekly" | "monthly", string>;
    save: string;
    reset: string;
    saved: string;
  };
  dashboard: {
    kpi: {
      totalProducts: string;
      promising: string;
      jpToCn: string;
      cnToJp: string;
      seasonal: string;
      avgMargin: string;
    };
    topOpportunities: string;
    topPriceGap: string;
    topMargin: string;
    topDemand: string;
    topSeasonal: string;
    viewAll: string;
    demandIndex: string;
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
    decompositionTitle: string;
    sourceAi: string;
    sourceRule: string;
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
  forecast: {
    historyTitle: string;
    historyDescription: string;
    forecastTitle: string;
    forecastDescription: string;
    priceForecast: string;
    demandForecast: string;
    japanPrice: string;
    chinaPrice: string;
    actual: string;
    forecastLabel: string;
    confidence: string;
    trend: string;
    trendUp: string;
    trendDown: string;
    trendFlat: string;
    perMonth: string;
    demandUnit: string;
  };
  oem: {
    title: string;
    description: string;
    likelihood: string;
    supplyStability: string;
    verdict: { likely: string; possible: string; unlikely: string };
    signals: {
      noBrand: string;
      oemMatchType: string;
      largePriceGap: string;
      massProduction: string;
      weakBrandSignal: string;
    };
  };
  similar: {
    title: string;
    description: string;
    similarity: string;
    empty: string;
  };
  reviews: {
    title: string;
    description: string;
    overall: string;
    positive: string;
    neutral: string;
    negative: string;
    sampleSize: string;
    mentions: string;
    aspects: {
      quality: string;
      price: string;
      delivery: string;
      durability: string;
      design: string;
      usability: string;
    };
  };
  imageComparison: {
    title: string;
    description: string;
    similarity: string;
    unavailable: string;
    verdict: { sameProduct: string; likelySame: string; different: string };
  };
  simulator: {
    title: string;
    description: string;
    reset: string;
  };
  markets: {
    japanAvgPrice: string;
    chinaAvgPrice: string;
    avgCompetitors: string;
    avgDemand: string;
    japanChinaHint: (japan: string, china: string) => string;
    comparisonTitle: string;
    subCategory: string;
    products: string;
    bidirectional: string;
  };
  seasonal: {
    urgency: Record<"hot" | "soon" | "watch" | "later", string>;
    peak: string;
    recommendedBuy: string;
    currentScore: string;
    predictedScore: string;
    daysToPeak: (days: number) => string;
    monthLabel: (month: number) => string;
    empty: string;
  };
  analytics: {
    directionSplitTitle: string;
    subCategoryScoreTitle: string;
    marginDistributionTitle: string;
    profitByProductTitle: string;
    count: string;
    avgScore: string;
    profit: string;
    brandTitle: string;
    brandDescription: string;
    brandColumn: string;
    products: string;
    avgMargin: string;
    totalProfit: string;
    competition: string;
    oemShare: string;
    direction: string;
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
    dashboard: {
      title: "Dashboard",
      description: "今日どの商品に商機があるかを一画面で把握します。有望商品・商流方向・利益機会を俯瞰できます。",
    },
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
    products: {
      title: "Products",
      description: "調査済み商品データベース。商品を選ぶと詳細と利益シミュレーションを確認できます。",
    },
    markets: {
      title: "Markets",
      description: "日本市場と中国市場をカテゴリー単位で比較します。平均価格・競合・需要から有利な方向を把握します。",
    },
    seasonal: {
      title: "Seasonal",
      description: "季節需要の先取り。ピーク時期と推奨仕入れ時期をルールベースで予測します。",
    },
    analytics: {
      title: "Analytics",
      description: "商流方向・カテゴリー・利益率・推定利益の分布を可視化します。",
    },
    watchlists: {
      title: "Watchlists",
      description: "監視するカテゴリーと商品を保存します。設定した頻度で自動再調査の対象になります。",
    },
    alerts: {
      title: "Alerts",
      description: "Score 上昇や季節需要の接近など、商機の変化を通知します。",
    },
    settings: {
      title: "Settings",
      description: "為替・コスト・利益率/Score 閾値・通知・監視頻度を設定します。値はこのブラウザに保存されます。",
    },
  },
  watchlists: {
    categoriesTitle: "監視カテゴリー",
    productsTitle: "監視商品",
    addCategory: "追加",
    addPlaceholder: "カテゴリー名を入力",
    remove: "削除",
    emptyCategories: "監視中のカテゴリーはありません。",
    emptyProducts: "監視中の商品はありません。",
  },
  alerts: {
    newOpportunity: "🔥 新しい商機",
    seasonApproaching: "🌱 季節需要が接近",
    reasonsLabel: "理由",
    recommendedResearch: "推奨調査時期",
    empty: "現在アラートはありません。",
  },
  settings: {
    fxTitle: "為替",
    costTitle: "既定コスト",
    thresholdTitle: "閾値",
    notificationTitle: "通知・監視",
    exchangeRate: "為替レート (CNY→JPY)",
    exchangeRateHint: "1 元あたりの円",
    intlShipping: "既定 国際送料",
    domesticShipping: "既定 国内送料",
    importTaxRate: "関税・税率 (%)",
    platformFeeRate: "販売手数料率 (%)",
    minMargin: "最低利益率 (%)",
    minScore: "最低 Opportunity Score",
    emailAlerts: "メールアラート",
    monitorFrequency: "監視頻度",
    frequency: { daily: "毎日", weekly: "毎週", monthly: "毎月" },
    save: "保存",
    reset: "既定値に戻す",
    saved: "設定を保存しました。",
  },
  dashboard: {
    kpi: {
      totalProducts: "調査商品数",
      promising: "有望商品数",
      jpToCn: "日本 → 中国",
      cnToJp: "中国 → 日本",
      seasonal: "季節商品",
      avgMargin: "平均利益率",
    },
    topOpportunities: "🔥 今おすすめの商機",
    topPriceGap: "価格差 Top",
    topMargin: "利益率 Top",
    topDemand: "需要上昇 Top",
    topSeasonal: "季節先取り Top",
    viewAll: "すべて見る",
    demandIndex: "需要指数",
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
    decompositionTitle: "AI カテゴリー分解",
    sourceAi: "AI 生成",
    sourceRule: "ルールベース",
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
  forecast: {
    historyTitle: "価格・需要の推移",
    historyDescription: "過去 12 か月の日中価格と需要指数（合成データ）。",
    forecastTitle: "価格・需要予測",
    forecastDescription: "有望方向の販売市場を対象に、先 6 か月をトレンド＋季節性で予測します。",
    priceForecast: "価格予測",
    demandForecast: "需要予測",
    japanPrice: "日本価格",
    chinaPrice: "中国価格",
    actual: "実績",
    forecastLabel: "予測",
    confidence: "予測信頼度",
    trend: "トレンド",
    trendUp: "上昇傾向",
    trendDown: "下降傾向",
    trendFlat: "横ばい",
    perMonth: "/月",
    demandUnit: "需要指数",
  },
  oem: {
    title: "OEM 分析",
    description: "ブランド有無・マッチ・価格差・供給規模から OEM/ノーブランド由来の可能性を推定します。",
    likelihood: "OEM 可能性",
    supplyStability: "供給安定性",
    verdict: { likely: "可能性高", possible: "可能性あり", unlikely: "可能性低" },
    signals: {
      noBrand: "ノーブランド/OEM 表記",
      oemMatchType: "OEM・類似マッチ",
      largePriceGap: "大きな価格差",
      massProduction: "中国側の多数出品（量産）",
      weakBrandSignal: "弱いブランド信号",
    },
  },
  similar: {
    title: "類似・代替候補",
    description: "サブカテゴリー・名称・ブランド・価格帯の近さから、横断で類似商品を探索します。",
    similarity: "類似度",
    empty: "類似候補は見つかりませんでした。",
  },
  reviews: {
    title: "レビュー分析",
    description: "需要・リスク・レビュー件数から観点別の評価を推定します（合成データ）。",
    overall: "総合評価",
    positive: "肯定的",
    neutral: "中立",
    negative: "否定的",
    sampleSize: "レビュー件数",
    mentions: "言及数",
    aspects: {
      quality: "品質",
      price: "価格",
      delivery: "配送",
      durability: "耐久性",
      design: "デザイン",
      usability: "使いやすさ",
    },
  },
  imageComparison: {
    title: "画像比較",
    description: "日中出品の画像一致度を推定します。",
    similarity: "推定画像一致度",
    unavailable: "画像未取得のため、マッチ情報からの推定値です。",
    verdict: { sameProduct: "同一商品", likelySame: "同一の可能性", different: "別商品の可能性" },
  },
  simulator: {
    title: "利益シミュレーター",
    description: "数値を調整すると、推定利益・利益率・ROI・損益分岐価格がリアルタイムで再計算されます。",
    reset: "初期値に戻す",
  },
  markets: {
    japanAvgPrice: "日本 平均価格",
    chinaAvgPrice: "中国 平均価格",
    avgCompetitors: "平均競合数",
    avgDemand: "平均需要指数",
    japanChinaHint: (japan, china) => `日本 ${japan} ・ 中国 ${china}`,
    comparisonTitle: "カテゴリー別 日中比較",
    subCategory: "カテゴリー",
    products: "商品数",
    bidirectional: "双方向",
  },
  seasonal: {
    urgency: { hot: "30日以内", soon: "60日以内", watch: "90日以内", later: "90日超" },
    peak: "ピーク時期",
    recommendedBuy: "推奨仕入れ時期",
    currentScore: "現在Score",
    predictedScore: "予測Score",
    daysToPeak: (days) => `ピークまで ${days}日`,
    monthLabel: (month) => `${month}月`,
    empty: "季節商品はありません。",
  },
  analytics: {
    directionSplitTitle: "商流方向の構成",
    subCategoryScoreTitle: "カテゴリー別 平均Score",
    marginDistributionTitle: "利益率の分布",
    profitByProductTitle: "商品別 推定利益",
    count: "件数",
    avgScore: "平均Score",
    profit: "推定利益",
    brandTitle: "ブランド・競合分析",
    brandDescription: "ブランド単位で平均Score・利益率・推定利益合計・競合水準・OEM 比率を集計します。",
    brandColumn: "ブランド",
    products: "商品数",
    avgMargin: "平均利益率",
    totalProfit: "推定利益合計",
    competition: "競合水準",
    oemShare: "OEM 比率",
    direction: "優勢方向",
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
    dashboard: {
      title: "仪表盘",
      description: "在一屏内掌握今天哪些商品有商机。俯瞰优质商品、贸易方向与利润机会。",
    },
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
    products: {
      title: "商品库",
      description: "已调研的商品数据库。选择商品即可查看详情与利润模拟。",
    },
    markets: {
      title: "市场对比",
      description: "按品类对比日本市场与中国市场。从平均价格、竞争与需求把握更有利的方向。",
    },
    seasonal: {
      title: "季节商机",
      description: "提前布局季节性需求。基于规则预测需求高峰与建议采购时期。",
    },
    analytics: {
      title: "数据分析",
      description: "可视化贸易方向、品类、利润率与预估利润的分布。",
    },
    watchlists: {
      title: "关注列表",
      description: "保存需要监控的品类与商品。将按设定的频率自动重新调研。",
    },
    alerts: {
      title: "提醒",
      description: "当 Score 上升或季节需求临近等商机发生变化时进行通知。",
    },
    settings: {
      title: "设置",
      description: "设置汇率、成本、利润率/Score 阈值、通知与监控频率。数值保存在本浏览器中。",
    },
  },
  watchlists: {
    categoriesTitle: "监控品类",
    productsTitle: "监控商品",
    addCategory: "添加",
    addPlaceholder: "输入品类名称",
    remove: "移除",
    emptyCategories: "暂无监控中的品类。",
    emptyProducts: "暂无监控中的商品。",
  },
  alerts: {
    newOpportunity: "🔥 新商机",
    seasonApproaching: "🌱 季节需求临近",
    reasonsLabel: "理由",
    recommendedResearch: "建议调研时期",
    empty: "当前没有提醒。",
  },
  settings: {
    fxTitle: "汇率",
    costTitle: "默认成本",
    thresholdTitle: "阈值",
    notificationTitle: "通知与监控",
    exchangeRate: "汇率 (CNY→JPY)",
    exchangeRateHint: "每 1 元对应的日元",
    intlShipping: "默认 国际运费",
    domesticShipping: "默认 国内运费",
    importTaxRate: "关税・税率 (%)",
    platformFeeRate: "销售手续费率 (%)",
    minMargin: "最低利润率 (%)",
    minScore: "最低 Opportunity Score",
    emailAlerts: "邮件提醒",
    monitorFrequency: "监控频率",
    frequency: { daily: "每天", weekly: "每周", monthly: "每月" },
    save: "保存",
    reset: "恢复默认值",
    saved: "设置已保存。",
  },
  dashboard: {
    kpi: {
      totalProducts: "调研商品数",
      promising: "优质商品数",
      jpToCn: "日本 → 中国",
      cnToJp: "中国 → 日本",
      seasonal: "季节商品",
      avgMargin: "平均利润率",
    },
    topOpportunities: "🔥 今日推荐商机",
    topPriceGap: "价差 Top",
    topMargin: "利润率 Top",
    topDemand: "需求上升 Top",
    topSeasonal: "季节前瞻 Top",
    viewAll: "查看全部",
    demandIndex: "需求指数",
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
    decompositionTitle: "AI 品类拆解",
    sourceAi: "AI 生成",
    sourceRule: "规则生成",
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
  forecast: {
    historyTitle: "价格与需求走势",
    historyDescription: "过去 12 个月的中日价格与需求指数（合成数据）。",
    forecastTitle: "价格与需求预测",
    forecastDescription: "以优势方向的销售市场为对象，基于趋势与季节性预测未来 6 个月。",
    priceForecast: "价格预测",
    demandForecast: "需求预测",
    japanPrice: "日本价格",
    chinaPrice: "中国价格",
    actual: "实际",
    forecastLabel: "预测",
    confidence: "预测可信度",
    trend: "趋势",
    trendUp: "上升趋势",
    trendDown: "下降趋势",
    trendFlat: "持平",
    perMonth: "/月",
    demandUnit: "需求指数",
  },
  oem: {
    title: "OEM 分析",
    description: "根据品牌有无、匹配、价格差与供应规模，推断商品来自 OEM/无品牌的可能性。",
    likelihood: "OEM 可能性",
    supplyStability: "供应稳定性",
    verdict: { likely: "可能性高", possible: "有可能", unlikely: "可能性低" },
    signals: {
      noBrand: "无品牌/OEM 标注",
      oemMatchType: "OEM・相似匹配",
      largePriceGap: "较大价格差",
      massProduction: "中国侧大量在售（量产）",
      weakBrandSignal: "品牌信号弱",
    },
  },
  similar: {
    title: "相似・替代候选",
    description: "根据子类目、名称、品牌与价格区间的接近度，跨类目探索相似商品。",
    similarity: "相似度",
    empty: "未找到相似候选。",
  },
  reviews: {
    title: "评价分析",
    description: "根据需求、风险与评价数量推断各观点的评分（合成数据）。",
    overall: "综合评分",
    positive: "正面",
    neutral: "中立",
    negative: "负面",
    sampleSize: "评价数量",
    mentions: "提及数",
    aspects: {
      quality: "品质",
      price: "价格",
      delivery: "配送",
      durability: "耐久性",
      design: "设计",
      usability: "易用性",
    },
  },
  imageComparison: {
    title: "图片比较",
    description: "推断中日商品图片的一致度。",
    similarity: "预估图片一致度",
    unavailable: "因未获取图片，为基于匹配信息的推断值。",
    verdict: { sameProduct: "同一商品", likelySame: "可能同一", different: "可能不同" },
  },
  simulator: {
    title: "利润模拟器",
    description: "调整数值后，预估利润、利润率、ROI 与盈亏平衡价会实时重新计算。",
    reset: "恢复初始值",
  },
  markets: {
    japanAvgPrice: "日本 平均价格",
    chinaAvgPrice: "中国 平均价格",
    avgCompetitors: "平均竞争数",
    avgDemand: "平均需求指数",
    japanChinaHint: (japan, china) => `日本 ${japan} ・ 中国 ${china}`,
    comparisonTitle: "分品类 日中对比",
    subCategory: "品类",
    products: "商品数",
    bidirectional: "双向",
  },
  seasonal: {
    urgency: { hot: "30天内", soon: "60天内", watch: "90天内", later: "90天以上" },
    peak: "需求高峰",
    recommendedBuy: "建议采购时期",
    currentScore: "当前Score",
    predictedScore: "预测Score",
    daysToPeak: (days) => `距高峰 ${days}天`,
    monthLabel: (month) => `${month}月`,
    empty: "暂无季节商品。",
  },
  analytics: {
    directionSplitTitle: "贸易方向构成",
    subCategoryScoreTitle: "分品类 平均Score",
    marginDistributionTitle: "利润率分布",
    profitByProductTitle: "分商品 预估利润",
    count: "数量",
    avgScore: "平均Score",
    profit: "预估利润",
    brandTitle: "品牌・竞争分析",
    brandDescription: "按品牌汇总平均Score、利润率、预估利润合计、竞争水平与 OEM 比例。",
    brandColumn: "品牌",
    products: "商品数",
    avgMargin: "平均利润率",
    totalProfit: "预估利润合计",
    competition: "竞争水平",
    oemShare: "OEM 比例",
    direction: "优势方向",
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
