"""Profit Engine（STEP 10-11）。決定論的コスト計算。

方向（販売/仕入市場）とコストパラメータを引数化し、実データ化に備える。
コストパラメータは DB の cost_rules から注入できる（repository.load_cost_params）。
数値はルールエンジンで確定させる（原則: セクション 93）。
"""

from __future__ import annotations

from dataclasses import dataclass

from .catalog import CatalogEntry
from .schemas import (
    ConfidenceBreakdown,
    CostBreakdown,
    Economics,
    MatchType,
    ReasonCode,
    RiskLevel,
    Season,
    SizeTier,
    TradeDirection,
)

INTL_SHIPPING: dict[SizeTier, int] = {SizeTier.S: 800, SizeTier.M: 1600, SizeTier.L: 3200}
DOMESTIC_SHIPPING: dict[SizeTier, int] = {SizeTier.S: 500, SizeTier.M: 700, SizeTier.L: 1200}
PACKAGING: dict[SizeTier, int] = {SizeTier.S: 150, SizeTier.M: 250, SizeTier.L: 450}
IMPORT_TAX_RATE = 0.05
PLATFORM_FEE_RATE = 0.10
OTHER_RATE = 0.02


@dataclass(frozen=True)
class CostParams:
    """利益計算のコストパラメータ。DB の cost_rules から構築できる。"""

    intl_shipping: dict[SizeTier, int]
    domestic_shipping: dict[SizeTier, int]
    packaging: dict[SizeTier, int]
    import_tax_rate: float
    platform_fee_rate: float
    other_rate: float


DEFAULT_COST_PARAMS = CostParams(
    intl_shipping=INTL_SHIPPING,
    domestic_shipping=DOMESTIC_SHIPPING,
    packaging=PACKAGING,
    import_tax_rate=IMPORT_TAX_RATE,
    platform_fee_rate=PLATFORM_FEE_RATE,
    other_rate=OTHER_RATE,
)


def derive_economics_for(
    entry: CatalogEntry, direction: TradeDirection, params: CostParams = DEFAULT_COST_PARAMS
) -> Economics:
    """指定方向の総コストと利益を算出する。CN_TO_JP=中国仕入→日本販売。"""
    is_import = direction == TradeDirection.CN_TO_JP
    sell_price = entry.japan.price if is_import else entry.china.price
    purchase_price = entry.china.price if is_import else entry.japan.price

    cost = CostBreakdown(
        purchase_price=purchase_price,
        intl_shipping=params.intl_shipping[entry.size_tier],
        domestic_shipping=params.domestic_shipping[entry.size_tier],
        import_tax=round(purchase_price * params.import_tax_rate),
        platform_fee=round(sell_price * params.platform_fee_rate),
        packaging=params.packaging[entry.size_tier],
        other=round(sell_price * params.other_rate),
    )

    total_cost = (
        cost.purchase_price
        + cost.intl_shipping
        + cost.domestic_shipping
        + cost.import_tax
        + cost.platform_fee
        + cost.packaging
        + cost.other
    )
    estimated_profit = sell_price - total_cost
    margin_rate = estimated_profit / sell_price if sell_price > 0 else 0.0
    roi = estimated_profit / total_cost if total_cost > 0 else 0.0

    return Economics(
        sell_price=sell_price,
        cost=cost,
        total_cost=total_cost,
        estimated_profit=estimated_profit,
        margin_rate=margin_rate,
        roi=roi,
        break_even_sell_price=total_cost,
    )


def derive_economics(entry: CatalogEntry, params: CostParams = DEFAULT_COST_PARAMS) -> Economics:
    """エントリ既定方向の利益（後方互換ラッパー）。"""
    return derive_economics_for(entry, entry.best_direction, params)


def price_gap_rate(entry: CatalogEntry) -> float:
    high = max(entry.japan.price, entry.china.price)
    low = min(entry.japan.price, entry.china.price)
    return (high - low) / low if low > 0 else 0.0


def _sell_market(entry: CatalogEntry, direction: TradeDirection):
    return entry.japan if direction == TradeDirection.CN_TO_JP else entry.china


def derive_reasons(entry: CatalogEntry, direction: TradeDirection, economics: Economics) -> list[ReasonCode]:
    reasons: list[ReasonCode] = []
    sell_market = _sell_market(entry, direction)

    if economics.margin_rate >= 0.25:
        reasons.append(ReasonCode.HIGH_MARGIN)
    if price_gap_rate(entry) >= 1:
        reasons.append(ReasonCode.PRICE_GAP)
    if sell_market.competitors <= 40:
        reasons.append(ReasonCode.LOW_COMPETITION)
    if sell_market.demand_index >= 70:
        reasons.append(ReasonCode.DEMAND_RISING)
    if entry.seasonality != Season.ALL_YEAR:
        reasons.append(ReasonCode.SEASONAL_PEAK)
    if entry.match_type in (MatchType.EXACT, MatchType.MODEL_MATCH):
        reasons.append(ReasonCode.STABLE_SUPPLY)
    if entry.risk == RiskLevel.HIGH:
        reasons.append(ReasonCode.HIGH_RISK)

    return reasons


def derive_confidence(entry: CatalogEntry, direction: TradeDirection, economics: Economics) -> ConfidenceBreakdown:
    sell_market = _sell_market(entry, direction)
    price = max(40, min(98, 100 - sell_market.competitors))
    profit = max(40, min(98, round(60 + economics.margin_rate * 120)))
    return ConfidenceBreakdown(match=entry.match_confidence, price=price, profit=profit)
