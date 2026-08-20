"""Dashboard / Analytics の集計（DB 由来）。フロントの lib/research/{dashboard,analytics}.ts に対応。"""

from __future__ import annotations

from statistics import mean

from . import opportunity_engine, services
from .catalog import CatalogEntry
from .economics import CostParams, DEFAULT_COST_PARAMS, derive_reasons
from .schemas import (
    AnalyticsResponse,
    DashboardKpis,
    DashboardResponse,
    DirectionSplit,
    MarginBucket,
    Opportunity,
    ProfitByProduct,
    Season,
    SubCategoryScore,
    TopListItem,
    TopOpportunity,
    TradeDirection,
)

PROMISING_SCORE = 60


def _opportunities(entries: list[CatalogEntry], params: CostParams) -> list[Opportunity]:
    return [services._to_opportunity(e, params) for e in entries]


def get_dashboard(entries: list[CatalogEntry], params: CostParams = DEFAULT_COST_PARAMS) -> DashboardResponse:
    opps = _opportunities(entries, params)
    entries_by_id = {e.id: e for e in entries}
    promising = [o for o in opps if o.score >= PROMISING_SCORE]

    kpis = DashboardKpis(
        total_products=len(opps),
        promising=len(promising),
        jp_to_cn=sum(1 for o in promising if o.best_direction == TradeDirection.JP_TO_CN),
        cn_to_jp=sum(1 for o in promising if o.best_direction == TradeDirection.CN_TO_JP),
        seasonal=sum(1 for e in entries if e.seasonality != Season.ALL_YEAR),
        avg_margin=(mean(o.margin_rate for o in promising) if promising else 0.0),
    )

    top_opportunities: list[TopOpportunity] = []
    for o in sorted(opps, key=lambda x: x.score, reverse=True)[:5]:
        entry = entries_by_id.get(o.id)
        reasons = []
        if entry is not None:
            best = opportunity_engine.evaluate(entry, params).best
            reasons = derive_reasons(entry, best.direction, best.economics)
        top_opportunities.append(
            TopOpportunity(
                id=o.id,
                name=o.name,
                sub_category=o.sub_category,
                best_direction=o.best_direction,
                score=o.score,
                estimated_profit=o.estimated_profit,
                margin_rate=o.margin_rate,
                top_reason=reasons[0] if reasons else None,
            )
        )

    top_price_gap = [
        TopListItem(id=o.id, name=o.name, direction=o.best_direction, value=o.price_gap_rate)
        for o in sorted(opps, key=lambda x: x.price_gap_rate, reverse=True)[:5]
    ]
    top_margin = [
        TopListItem(id=o.id, name=o.name, direction=o.best_direction, value=o.margin_rate)
        for o in sorted(opps, key=lambda x: x.margin_rate, reverse=True)[:5]
    ]

    # 需要: 販売先市場の需要指数。
    demand_rows: list[TopListItem] = []
    for e in entries:
        best = opportunity_engine.evaluate(e, params).best
        sell_market = e.japan if best.direction == TradeDirection.CN_TO_JP else e.china
        demand_rows.append(
            TopListItem(id=e.id, name=e.name, direction=best.direction, value=float(sell_market.demand_index))
        )
    top_demand = sorted(demand_rows, key=lambda x: x.value, reverse=True)[:5]

    top_seasonal = services.get_seasonal_opportunities(entries=entries, params=params)[:5]

    return DashboardResponse(
        kpis=kpis,
        top_opportunities=top_opportunities,
        top_price_gap=top_price_gap,
        top_margin=top_margin,
        top_demand=top_demand,
        top_seasonal=top_seasonal,
    )


def get_analytics(entries: list[CatalogEntry], params: CostParams = DEFAULT_COST_PARAMS) -> AnalyticsResponse:
    opps = _opportunities(entries, params)

    direction_split: list[DirectionSplit] = []
    for direction in (TradeDirection.JP_TO_CN, TradeDirection.CN_TO_JP):
        items = [o for o in opps if o.best_direction == direction]
        avg_profit = round(mean(o.estimated_profit for o in items)) if items else 0
        direction_split.append(DirectionSplit(direction=direction, count=len(items), avg_profit=avg_profit))

    by_sub: dict[str, list[Opportunity]] = {}
    for o in opps:
        by_sub.setdefault(o.sub_category, []).append(o)
    sub_scores = sorted(
        (
            SubCategoryScore(sub_category=sub, avg_score=round(mean(o.score for o in items)), count=len(items))
            for sub, items in by_sub.items()
        ),
        key=lambda s: s.avg_score,
        reverse=True,
    )

    buckets = [
        MarginBucket(id="lt10", label="< 10%", count=0),
        MarginBucket(id="10to20", label="10–20%", count=0),
        MarginBucket(id="20to30", label="20–30%", count=0),
        MarginBucket(id="gte30", label="30%+", count=0),
    ]
    for o in opps:
        pct = o.margin_rate * 100
        if pct < 10:
            buckets[0].count += 1
        elif pct < 20:
            buckets[1].count += 1
        elif pct < 30:
            buckets[2].count += 1
        else:
            buckets[3].count += 1

    profit_by_product = [
        ProfitByProduct(id=o.id, name=o.name, estimated_profit=o.estimated_profit, direction=o.best_direction)
        for o in sorted(opps, key=lambda x: x.estimated_profit, reverse=True)[:8]
    ]

    return AnalyticsResponse(
        direction_split=direction_split,
        sub_category_scores=list(sub_scores),
        margin_distribution=buckets,
        profit_by_product=profit_by_product,
    )
