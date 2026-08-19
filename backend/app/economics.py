"""Profit Engine（決定論的コスト計算）。フロントの src/lib/research/economics.ts に対応。

数値はルールエンジンで確定させる（原則: セクション 93）。MVP のパラメータは暫定値で、
将来的にユーザー設定（Settings）や DB のコストルールから注入する。
"""

from __future__ import annotations

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


def derive_economics(entry: CatalogEntry) -> Economics:
    is_import = entry.best_direction == TradeDirection.CN_TO_JP
    sell_price = entry.japan.price if is_import else entry.china.price
    purchase_price = entry.china.price if is_import else entry.japan.price

    cost = CostBreakdown(
        purchase_price=purchase_price,
        intl_shipping=INTL_SHIPPING[entry.size_tier],
        domestic_shipping=DOMESTIC_SHIPPING[entry.size_tier],
        import_tax=round(purchase_price * IMPORT_TAX_RATE),
        platform_fee=round(sell_price * PLATFORM_FEE_RATE),
        packaging=PACKAGING[entry.size_tier],
        other=round(sell_price * OTHER_RATE),
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


def price_gap_rate(entry: CatalogEntry) -> float:
    high = max(entry.japan.price, entry.china.price)
    low = min(entry.japan.price, entry.china.price)
    return (high - low) / low if low > 0 else 0.0


def derive_reasons(entry: CatalogEntry, economics: Economics) -> list[ReasonCode]:
    reasons: list[ReasonCode] = []
    sell_market = entry.japan if entry.best_direction == TradeDirection.CN_TO_JP else entry.china

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


def derive_confidence(entry: CatalogEntry, economics: Economics) -> ConfidenceBreakdown:
    sell_market = entry.japan if entry.best_direction == TradeDirection.CN_TO_JP else entry.china
    price = max(40, min(98, 100 - sell_market.competitors))
    profit = max(40, min(98, round(60 + economics.margin_rate * 120)))
    return ConfidenceBreakdown(match=entry.match_confidence, price=price, profit=profit)
