"""ドメインサービス。カタログ＋Profit Engine から API 応答を導出する。

フロントの src/lib/research/{mock-data,markets,seasonal,research-flow}.ts に対応。
"""

from __future__ import annotations

from datetime import datetime, timezone
from statistics import mean, median

from .catalog import PRODUCT_CATALOG, CatalogEntry
from .economics import derive_confidence, derive_economics, derive_reasons, price_gap_rate
from .schemas import (
    MarketAggregate,
    MarketComparisonRow,
    MarketOverview,
    Opportunity,
    ProductDetail,
    ProfitSimulateRequest,
    ProfitSimulateResponse,
    ResearchDirection,
    ResearchOptions,
    ResearchResult,
    Season,
    SeasonalOpportunity,
    TradeDirection,
)

# ---- Opportunities -------------------------------------------------------


def _to_opportunity(entry: CatalogEntry) -> Opportunity:
    economics = derive_economics(entry)
    return Opportunity(
        id=entry.id,
        name=entry.name,
        brand=entry.brand,
        category=entry.category,
        sub_category=entry.sub_category,
        image_url=entry.image_url,
        best_direction=entry.best_direction,
        japan_price=entry.japan.price,
        china_price=entry.china.price,
        price_gap_rate=price_gap_rate(entry),
        estimated_profit=economics.estimated_profit,
        margin_rate=economics.margin_rate,
        seasonality=entry.seasonality,
        risk=entry.risk,
        score=entry.score,
        match_type=entry.match_type,
        match_confidence=entry.match_confidence,
    )


def list_opportunities(
    direction: TradeDirection | None = None,
    min_score: int | None = None,
    min_margin: float | None = None,
    entries: list[CatalogEntry] | None = None,
) -> list[Opportunity]:
    source = entries if entries is not None else PRODUCT_CATALOG
    items = [_to_opportunity(entry) for entry in source]
    if direction is not None:
        items = [o for o in items if o.best_direction == direction]
    if min_score is not None:
        items = [o for o in items if o.score >= min_score]
    if min_margin is not None:
        items = [o for o in items if o.margin_rate * 100 >= min_margin]
    return sorted(items, key=lambda o: o.score, reverse=True)


def get_product_detail(product_id: str, entries: list[CatalogEntry] | None = None) -> ProductDetail | None:
    source = entries if entries is not None else PRODUCT_CATALOG
    entry = next((e for e in source if e.id == product_id), None)
    if entry is None:
        return None
    economics = derive_economics(entry)
    return ProductDetail(
        id=entry.id,
        name=entry.name,
        brand=entry.brand,
        category=entry.category,
        sub_category=entry.sub_category,
        model=entry.model,
        image_url=entry.image_url,
        best_direction=entry.best_direction,
        seasonality=entry.seasonality,
        risk=entry.risk,
        match_type=entry.match_type,
        match_confidence=entry.match_confidence,
        score=entry.score,
        japan=entry.japan,
        china=entry.china,
        price_gap_rate=price_gap_rate(entry),
        economics=economics,
        reasons=derive_reasons(entry, economics),
        confidence=derive_confidence(entry, economics),
    )


# ---- Research ------------------------------------------------------------


def compute_research_result(
    options: ResearchOptions, entries: list[CatalogEntry] | None = None
) -> ResearchResult:
    from .schemas import MatchType

    source = entries if entries is not None else PRODUCT_CATALOG
    matched: list[CatalogEntry] = []
    for entry in source:
        economics = derive_economics(entry)
        direction_ok = (
            options.direction == ResearchDirection.BOTH
            or entry.best_direction.value == options.direction.value
        )
        score_ok = entry.score >= options.min_score
        margin_ok = economics.margin_rate * 100 >= options.min_margin
        oem_ok = options.include_oem or entry.match_type != MatchType.OEM_CANDIDATE
        similar_ok = options.include_similar or entry.match_type != MatchType.SIMILAR
        seasonal_ok = options.include_seasonal or entry.seasonality == Season.ALL_YEAR
        if direction_ok and score_ok and margin_ok and oem_ok and similar_ok and seasonal_ok:
            matched.append(entry)

    jp_to_cn = sum(1 for e in matched if e.best_direction == TradeDirection.JP_TO_CN)
    cn_to_jp = sum(1 for e in matched if e.best_direction == TradeDirection.CN_TO_JP)
    products_analyzed = 0 if not matched else len(matched) * 14 + 6

    return ResearchResult(
        products_analyzed=products_analyzed,
        opportunities_found=len(matched),
        jp_to_cn=jp_to_cn,
        cn_to_jp=cn_to_jp,
    )


# ---- Profit --------------------------------------------------------------


def simulate_profit(req: ProfitSimulateRequest) -> ProfitSimulateResponse:
    total_cost = (
        req.purchase_price
        + req.intl_shipping
        + req.domestic_shipping
        + req.import_tax
        + req.platform_fee
        + req.packaging
        + req.other
    )
    estimated_profit = req.sell_price - total_cost
    margin_rate = estimated_profit / req.sell_price if req.sell_price > 0 else 0.0
    roi = estimated_profit / total_cost if total_cost > 0 else 0.0
    return ProfitSimulateResponse(
        total_cost=total_cost,
        estimated_profit=estimated_profit,
        margin_rate=margin_rate,
        roi=roi,
        break_even_sell_price=total_cost,
    )


# ---- Markets -------------------------------------------------------------


def _aggregate(prices: list[int], competitors: list[int], demand: list[int]) -> MarketAggregate:
    return MarketAggregate(
        avg_price=round(mean(prices)),
        median_price=round(median(prices)),
        avg_competitors=round(mean(competitors)),
        avg_demand=round(mean(demand)),
    )


def get_market_overview(entries: list[CatalogEntry] | None = None) -> MarketOverview:
    source = entries if entries is not None else PRODUCT_CATALOG
    return MarketOverview(
        japan_avg_price=round(mean(e.japan.price for e in source)),
        china_avg_price=round(mean(e.china.price for e in source)),
        japan_avg_competitors=round(mean(e.japan.competitors for e in source)),
        china_avg_competitors=round(mean(e.china.competitors for e in source)),
        japan_avg_demand=round(mean(e.japan.demand_index for e in source)),
        china_avg_demand=round(mean(e.china.demand_index for e in source)),
    )


def get_market_comparison(entries: list[CatalogEntry] | None = None) -> list[MarketComparisonRow]:
    source = entries if entries is not None else PRODUCT_CATALOG
    by_sub: dict[str, list[CatalogEntry]] = {}
    for entry in source:
        by_sub.setdefault(entry.sub_category, []).append(entry)

    rows: list[MarketComparisonRow] = []
    for sub_category, entries in by_sub.items():
        export_count = sum(1 for e in entries if e.best_direction == TradeDirection.JP_TO_CN)
        import_count = len(entries) - export_count
        dominant: TradeDirection | None = None
        if export_count > import_count:
            dominant = TradeDirection.JP_TO_CN
        elif import_count > export_count:
            dominant = TradeDirection.CN_TO_JP

        rows.append(
            MarketComparisonRow(
                sub_category=sub_category,
                product_count=len(entries),
                japan=_aggregate(
                    [e.japan.price for e in entries],
                    [e.japan.competitors for e in entries],
                    [e.japan.demand_index for e in entries],
                ),
                china=_aggregate(
                    [e.china.price for e in entries],
                    [e.china.competitors for e in entries],
                    [e.china.demand_index for e in entries],
                ),
                avg_score=round(mean(e.score for e in entries)),
                dominant_direction=dominant,
            )
        )

    return sorted(rows, key=lambda r: r.avg_score, reverse=True)


# ---- Seasonal ------------------------------------------------------------

SEASON_PEAK_MONTH: dict[Season, int] = {
    Season.SPRING: 4,
    Season.SUMMER: 7,
    Season.AUTUMN: 10,
    Season.WINTER: 12,
}


def _days_until_peak(now: datetime, peak_month: int) -> int:
    peak = datetime(now.year, peak_month, 15, tzinfo=timezone.utc)
    if peak < now:
        peak = datetime(now.year + 1, peak_month, 15, tzinfo=timezone.utc)
    return round((peak - now).total_seconds() / 86400)


def _urgency(days: int) -> str:
    if days <= 30:
        return "hot"
    if days <= 60:
        return "soon"
    if days <= 90:
        return "watch"
    return "later"


def _score_boost(urgency: str) -> int:
    return {"hot": 12, "soon": 8, "watch": 4}.get(urgency, 0)


def get_seasonal_opportunities(
    now: datetime | None = None, entries: list[CatalogEntry] | None = None
) -> list[SeasonalOpportunity]:
    now = now or datetime.now(timezone.utc)
    source = entries if entries is not None else PRODUCT_CATALOG
    items: list[SeasonalOpportunity] = []

    for entry in source:
        if entry.seasonality == Season.ALL_YEAR:
            continue
        peak_month = SEASON_PEAK_MONTH[entry.seasonality]
        days_to_peak = _days_until_peak(now, peak_month)
        urgency = _urgency(days_to_peak)
        recommended_buy_month = ((peak_month - 2 + 11) % 12) + 1
        economics = derive_economics(entry)

        items.append(
            SeasonalOpportunity(
                id=entry.id,
                name=entry.name,
                sub_category=entry.sub_category,
                best_direction=entry.best_direction,
                season=entry.seasonality,
                peak_month=peak_month,
                days_to_peak=days_to_peak,
                recommended_buy_month=recommended_buy_month,
                urgency=urgency,
                current_score=entry.score,
                predicted_score=min(100, entry.score + _score_boost(urgency)),
                estimated_profit=economics.estimated_profit,
            )
        )

    return sorted(items, key=lambda s: s.days_to_peak)
