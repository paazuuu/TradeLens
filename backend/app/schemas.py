"""API スキーマ（Pydantic）。フロント（TypeScript）の src/lib/research/types.ts に対応する。

レスポンスは camelCase エイリアスで返し、将来のフロント統合時にそのまま消費できるようにする。
"""

from __future__ import annotations

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
