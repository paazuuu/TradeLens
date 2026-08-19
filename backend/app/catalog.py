"""モック商品カタログ（フロントの src/lib/research/mock-data.ts に対応）。

生カタログを単一の真実とし、Opportunity 要約・ProductDetail・市場集計を導出する。
実データ接続時（STEP 6-8）に DB / データ取得層へ差し替える。データはすべて架空。
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from .schemas import MarketSnapshot, MatchType, RiskLevel, Season, SizeTier, TradeDirection


class CatalogEntry(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    name: str
    brand: str
    category: str
    sub_category: str
    model: str
    size_tier: SizeTier
    best_direction: TradeDirection
    seasonality: Season
    risk: RiskLevel
    match_type: MatchType
    match_confidence: int
    score: int
    japan: MarketSnapshot
    china: MarketSnapshot
    image_url: str | None = None


def _snap(price: int, competitors: int, demand: int, reviews: int) -> MarketSnapshot:
    return MarketSnapshot(price=price, competitors=competitors, demand_index=demand, review_count=reviews)


PRODUCT_CATALOG: list[CatalogEntry] = [
    CatalogEntry(
        id="opp-001", name="折りたたみLEDランタン 充電式", brand="OEM", category="キャンプ用品",
        sub_category="LEDランタン", model="LN-220C", size_tier=SizeTier.S,
        best_direction=TradeDirection.CN_TO_JP, seasonality=Season.SUMMER, risk=RiskLevel.LOW,
        match_type=MatchType.OEM_CANDIDATE, match_confidence=86, score=92,
        japan=_snap(4980, 28, 82, 1240), china=_snap(1720, 140, 55, 320),
    ),
    CatalogEntry(
        id="opp-002", name="ソロキャンプ用軽量アルミクッカーセット", brand="TrailMate", category="キャンプ用品",
        sub_category="クッカー", model="TM-CK3", size_tier=SizeTier.M,
        best_direction=TradeDirection.CN_TO_JP, seasonality=Season.ALL_YEAR, risk=RiskLevel.LOW,
        match_type=MatchType.MODEL_MATCH, match_confidence=91, score=88,
        japan=_snap(6800, 34, 74, 860), china=_snap(2950, 95, 60, 410),
    ),
    CatalogEntry(
        id="opp-003", name="ワンタッチ ドームテント 2人用", brand="TrailMate", category="キャンプ用品",
        sub_category="ワンタッチテント", model="TM-DT2", size_tier=SizeTier.L,
        best_direction=TradeDirection.CN_TO_JP, seasonality=Season.SUMMER, risk=RiskLevel.MEDIUM,
        match_type=MatchType.BRAND_MATCH, match_confidence=78, score=84,
        japan=_snap(12800, 46, 78, 540), china=_snap(6400, 120, 58, 260),
    ),
    CatalogEntry(
        id="opp-004", name="折りたたみローチェア アウトドア", brand="OEM", category="キャンプ用品",
        sub_category="ローチェア", model="LC-08", size_tier=SizeTier.M,
        best_direction=TradeDirection.CN_TO_JP, seasonality=Season.ALL_YEAR, risk=RiskLevel.LOW,
        match_type=MatchType.SIMILAR, match_confidence=72, score=81,
        japan=_snap(5480, 38, 68, 720), china=_snap(2380, 160, 52, 300),
    ),
    CatalogEntry(
        id="opp-005", name="日本製 高性能ガスバーナー CB缶対応", brand="SoraHeat", category="キャンプ用品",
        sub_category="バーナー", model="SH-B120", size_tier=SizeTier.S,
        best_direction=TradeDirection.JP_TO_CN, seasonality=Season.ALL_YEAR, risk=RiskLevel.HIGH,
        match_type=MatchType.EXACT, match_confidence=96, score=90,
        japan=_snap(7200, 22, 64, 1520), china=_snap(13400, 30, 80, 210),
    ),
    CatalogEntry(
        id="opp-006", name="チタン製シングルマグ 450ml", brand="SoraHeat", category="キャンプ用品",
        sub_category="ケトル", model="SH-TM450", size_tier=SizeTier.S,
        best_direction=TradeDirection.JP_TO_CN, seasonality=Season.ALL_YEAR, risk=RiskLevel.LOW,
        match_type=MatchType.EXACT, match_confidence=94, score=86,
        japan=_snap(3400, 26, 60, 980), china=_snap(6200, 38, 76, 180),
    ),
    CatalogEntry(
        id="opp-007", name="USB充電式 コンパクトランタン ミニ", brand="OEM", category="キャンプ用品",
        sub_category="USBランタン", model="UL-01", size_tier=SizeTier.S,
        best_direction=TradeDirection.CN_TO_JP, seasonality=Season.SUMMER, risk=RiskLevel.LOW,
        match_type=MatchType.OEM_CANDIDATE, match_confidence=68, score=79,
        japan=_snap(2980, 52, 66, 640), china=_snap(980, 180, 50, 220),
    ),
    CatalogEntry(
        id="opp-008", name="折りたたみキャンプテーブル アルミ", brand="TrailMate", category="キャンプ用品",
        sub_category="キャンプテーブル", model="TM-TB60", size_tier=SizeTier.L,
        best_direction=TradeDirection.CN_TO_JP, seasonality=Season.ALL_YEAR, risk=RiskLevel.MEDIUM,
        match_type=MatchType.MODEL_MATCH, match_confidence=83, score=74,
        japan=_snap(8900, 44, 62, 480), china=_snap(4600, 110, 54, 190),
    ),
    CatalogEntry(
        id="opp-009", name="ファミリーテント 大型 5人用", brand="OutFieldPro", category="キャンプ用品",
        sub_category="ファミリーテント", model="OFP-FT5", size_tier=SizeTier.L,
        best_direction=TradeDirection.CN_TO_JP, seasonality=Season.SUMMER, risk=RiskLevel.HIGH,
        match_type=MatchType.SIMILAR, match_confidence=61, score=58,
        japan=_snap(24800, 58, 70, 320), china=_snap(15200, 90, 56, 140),
    ),
    CatalogEntry(
        id="opp-010", name="ホットサンドメーカー 直火式 IH非対応", brand="OEM", category="キャンプ用品",
        sub_category="ホットサンドメーカー", model="HS-11", size_tier=SizeTier.S,
        best_direction=TradeDirection.CN_TO_JP, seasonality=Season.AUTUMN, risk=RiskLevel.LOW,
        match_type=MatchType.OEM_CANDIDATE, match_confidence=74, score=82,
        japan=_snap(3980, 30, 72, 560), china=_snap(1560, 130, 52, 240),
    ),
    CatalogEntry(
        id="opp-011", name="ガスランタン アウトドア用 マントル式", brand="OutFieldPro", category="キャンプ用品",
        sub_category="ガスランタン", model="OFP-GL2", size_tier=SizeTier.M,
        best_direction=TradeDirection.JP_TO_CN, seasonality=Season.AUTUMN, risk=RiskLevel.HIGH,
        match_type=MatchType.BRAND_MATCH, match_confidence=80, score=76,
        japan=_snap(9800, 24, 58, 700), china=_snap(16800, 36, 78, 160),
    ),
    CatalogEntry(
        id="opp-012", name="軽量ダウンシュラフ 3シーズン用", brand="OutFieldPro", category="キャンプ用品",
        sub_category="シュラフ", model="OFP-SB3", size_tier=SizeTier.M,
        best_direction=TradeDirection.CN_TO_JP, seasonality=Season.AUTUMN, risk=RiskLevel.MEDIUM,
        match_type=MatchType.SIMILAR, match_confidence=70, score=80,
        japan=_snap(11800, 40, 68, 430), china=_snap(5900, 100, 55, 200),
    ),
]


def find_entry(product_id: str) -> CatalogEntry | None:
    return next((entry for entry in PRODUCT_CATALOG if entry.id == product_id), None)
