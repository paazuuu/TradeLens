"""API スキーマ（Pydantic）。フロント（TypeScript）の src/lib/research/types.ts に対応する。

レスポンスは camelCase エイリアスで返し、将来のフロント統合時にそのまま消費できるようにする。
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """camelCase エイリアスで入出力する基底モデル（snake_case でも受け付ける）。"""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class TradeDirection(str, Enum):
    JP_TO_CN = "JP_TO_CN"
    CN_TO_JP = "CN_TO_JP"


class Season(str, Enum):
    SPRING = "Spring"
    SUMMER = "Summer"
    AUTUMN = "Autumn"
    WINTER = "Winter"
    ALL_YEAR = "AllYear"


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class MatchType(str, Enum):
    EXACT = "EXACT"
    BRAND_MATCH = "BRAND_MATCH"
    MODEL_MATCH = "MODEL_MATCH"
    SIMILAR = "SIMILAR"
    OEM_CANDIDATE = "OEM_CANDIDATE"
    UNMATCHED = "UNMATCHED"


class SizeTier(str, Enum):
    S = "S"
    M = "M"
    L = "L"


class ReasonCode(str, Enum):
    HIGH_MARGIN = "highMargin"
    PRICE_GAP = "priceGap"
    LOW_COMPETITION = "lowCompetition"
    DEMAND_RISING = "demandRising"
    SEASONAL_PEAK = "seasonalPeak"
    STABLE_SUPPLY = "stableSupply"
    HIGH_RISK = "highRisk"


class MarketSnapshot(CamelModel):
    price: int
    competitors: int
    demand_index: int
    review_count: int


class CostBreakdown(CamelModel):
    purchase_price: int
    intl_shipping: int
    domestic_shipping: int
    import_tax: int
    platform_fee: int
    packaging: int
    other: int


class Economics(CamelModel):
    sell_price: int
    cost: CostBreakdown
    total_cost: int
    estimated_profit: int
    margin_rate: float
    roi: float
    break_even_sell_price: int


class Opportunity(CamelModel):
    id: str
    name: str
    brand: str
    category: str
    sub_category: str
    image_url: str | None = None
    best_direction: TradeDirection
    japan_price: int
    china_price: int
    price_gap_rate: float
    estimated_profit: int
    margin_rate: float
    seasonality: Season
    risk: RiskLevel
    score: int
    match_type: MatchType
    match_confidence: int


class ConfidenceBreakdown(CamelModel):
    match: int
    price: int
    profit: int


class ProductDetail(CamelModel):
    id: str
    name: str
    brand: str
    category: str
    sub_category: str
    model: str
    image_url: str | None = None
    best_direction: TradeDirection
    seasonality: Season
    risk: RiskLevel
    match_type: MatchType
    match_confidence: int
    score: int
    japan: MarketSnapshot
    china: MarketSnapshot
    price_gap_rate: float
    economics: Economics
    reasons: list[ReasonCode]
    confidence: ConfidenceBreakdown


class ResearchDirection(str, Enum):
    JP_TO_CN = "JP_TO_CN"
    CN_TO_JP = "CN_TO_JP"
    BOTH = "BOTH"


class ResearchOptions(CamelModel):
    category: str
    direction: ResearchDirection = ResearchDirection.BOTH
    include_seasonal: bool = True
    include_oem: bool = True
    include_similar: bool = True
    min_margin: float = 20
    min_score: int = 70


class ResearchResult(CamelModel):
    products_analyzed: int
    opportunities_found: int
    jp_to_cn: int
    cn_to_jp: int


class ResearchJob(CamelModel):
    id: str
    status: str
    options: ResearchOptions
    result: ResearchResult


class ProfitSimulateRequest(CamelModel):
    sell_price: int
    purchase_price: int
    intl_shipping: int = 0
    domestic_shipping: int = 0
    import_tax: int = 0
    platform_fee: int = 0
    packaging: int = 0
    other: int = 0


class ProfitSimulateResponse(CamelModel):
    total_cost: int
    estimated_profit: int
    margin_rate: float
    roi: float
    break_even_sell_price: int


class MarketAggregate(CamelModel):
    avg_price: int
    median_price: int
    avg_competitors: int
    avg_demand: int


class MarketComparisonRow(CamelModel):
    sub_category: str
    product_count: int
    japan: MarketAggregate
    china: MarketAggregate
    avg_score: int
    dominant_direction: TradeDirection | None = None


class MarketOverview(CamelModel):
    japan_avg_price: int
    china_avg_price: int
    japan_avg_competitors: int
    china_avg_competitors: int
    japan_avg_demand: int
    china_avg_demand: int


class MarketsResponse(CamelModel):
    overview: MarketOverview
    comparison: list[MarketComparisonRow]


class DashboardKpis(CamelModel):
    total_products: int
    promising: int
    jp_to_cn: int
    cn_to_jp: int
    seasonal: int
    avg_margin: float


class TopOpportunity(CamelModel):
    id: str
    name: str
    sub_category: str
    best_direction: TradeDirection
    score: int
    estimated_profit: int
    margin_rate: float
    top_reason: ReasonCode | None = None


class TopListItem(CamelModel):
    id: str
    name: str
    direction: TradeDirection
    value: float


class DashboardResponse(CamelModel):
    kpis: DashboardKpis
    top_opportunities: list[TopOpportunity]
    top_price_gap: list[TopListItem]
    top_margin: list[TopListItem]
    top_demand: list[TopListItem]
    top_seasonal: list["SeasonalOpportunity"]


class DirectionSplit(CamelModel):
    direction: TradeDirection
    count: int
    avg_profit: int


class SubCategoryScore(CamelModel):
    sub_category: str
    avg_score: int
    count: int


class MarginBucket(CamelModel):
    id: str
    label: str
    count: int


class ProfitByProduct(CamelModel):
    id: str
    name: str
    estimated_profit: int
    direction: TradeDirection


class AnalyticsResponse(CamelModel):
    direction_split: list[DirectionSplit]
    sub_category_scores: list[SubCategoryScore]
    margin_distribution: list[MarginBucket]
    profit_by_product: list[ProfitByProduct]


class MatchRequest(CamelModel):
    japan_name: str
    china_name: str
    japan_brand: str | None = None
    china_brand: str | None = None
    japan_model: str | None = None
    china_model: str | None = None


class MatchSignals(CamelModel):
    name_similarity: float
    model_match: bool
    brand_match: bool


class MatchResult(CamelModel):
    match_type: MatchType
    confidence: int
    signals: MatchSignals


class MarketPriceInput(CamelModel):
    market: str  # JP / CN
    price: float  # 原通貨での価格
    currency: str = "JPY"
    competitors: int | None = None
    demand_index: int | None = None
    review_count: int | None = None
    source: str | None = None
    source_url: str | None = None


class ProductImport(CamelModel):
    id: str
    name: str
    brand: str
    category: str
    sub_category: str
    model: str = ""
    size_tier: SizeTier = SizeTier.M
    seasonality: Season = Season.ALL_YEAR
    risk: RiskLevel = RiskLevel.MEDIUM
    match_type: MatchType = MatchType.SIMILAR
    match_confidence: int | None = None
    image_url: str | None = None
    japan: MarketPriceInput
    china: MarketPriceInput


class IngestResponse(CamelModel):
    imported: int
    products: int
    market_prices: int


class SettingsOut(CamelModel):
    exchange_rate: float
    intl_shipping: int
    domestic_shipping: int
    import_tax_rate: float
    platform_fee_rate: float
    min_margin: float
    min_score: int


class AlertOut(CamelModel):
    id: int
    kind: str  # opportunity / season
    product_id: str | None = None
    message: str | None = None
    payload: dict | None = None
    created_at: datetime
    read_at: datetime | None = None


class MonitoringResult(CamelModel):
    watched_users: int
    alerts_created: int


class WatchlistCreate(CamelModel):
    kind: str  # category / product
    value: str
    monitor_frequency: str = "weekly"


class WatchlistItemOut(CamelModel):
    id: int
    kind: str
    value: str
    monitor_frequency: str


class RegisterRequest(CamelModel):
    email: str
    password: str
    display_name: str | None = None


class LoginRequest(CamelModel):
    email: str
    password: str


class UserOut(CamelModel):
    id: str
    email: str
    display_name: str | None = None


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SeasonalOpportunity(CamelModel):
    id: str
    name: str
    sub_category: str
    best_direction: TradeDirection
    season: Season
    peak_month: int
    days_to_peak: int
    recommended_buy_month: int
    urgency: str
    current_score: int
    predicted_score: int
    estimated_profit: int


# ---- 価格履歴・予測（Phase 2, セクション 41・47）----


class TimeSeriesPoint(CamelModel):
    """月次時系列の 1 点。date は "YYYY-MM"。"""

    date: str
    price: int
    demand: int


class ForecastPoint(CamelModel):
    """予測時系列の 1 点。date は "YYYY-MM"。"""

    date: str
    value: int


class PriceHistoryResponse(CamelModel):
    """商品 1 件の日中価格・需要履歴。"""

    product_id: str
    japan: list[TimeSeriesPoint]
    china: list[TimeSeriesPoint]


class ForecastSeries(CamelModel):
    """1 系列の予測結果（トレンド傾き・信頼度付き）。"""

    points: list[ForecastPoint]
    slope_per_month: float
    confidence: int


class ProductForecastResponse(CamelModel):
    """価格予測・需要予測（有望方向の販売市場基準）。"""

    product_id: str
    market: str  # 予測対象の販売市場（JP / CN）
    best_direction: TradeDirection
    price_forecast: ForecastSeries
    demand_forecast: ForecastSeries


# 前方参照（SeasonalOpportunity）の解決。
DashboardResponse.model_rebuild()
