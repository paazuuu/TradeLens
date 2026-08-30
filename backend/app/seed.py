"""モックカタログと Profit Engine から DB を初期投入する（開発用シード）。

products / market_prices / opportunities / profit_calculations / seasonal_profiles /
exchange_rates / cost_rules / categories を、API と同じ決定論的計算で埋める。
冪等性のため対象テーブルを一旦クリアしてから再投入する（MVP）。
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from . import opportunity_engine
from .catalog import PRODUCT_CATALOG
from .history import synthetic_series
from .economics import (
    IMPORT_TAX_RATE,
    OTHER_RATE,
    PACKAGING,
    PLATFORM_FEE_RATE,
    derive_reasons,
    price_gap_rate,
)
from .models import (
    Category,
    CostRule,
    ExchangeRate,
    MarketPrice,
    OpportunityRecord,
    PriceHistory,
    ProfitCalculation,
    Product,
    SeasonalProfile,
)
from .schemas import Season, SizeTier
from .services import SEASON_PEAK_MONTH

SEED_SOURCE = "mock-catalog"


def seed_database(session: Session) -> dict[str, int]:
    """DB をモックカタログで初期化し、投入件数を返す。"""
    now = datetime.now(timezone.utc)

    # 依存関係の子テーブルから順にクリアする。
    for model in (
        OpportunityRecord,
        ProfitCalculation,
        SeasonalProfile,
        PriceHistory,
        MarketPrice,
        Product,
        Category,
        ExchangeRate,
        CostRule,
    ):
        session.execute(delete(model))

    # カテゴリー（MVP は単一カテゴリー）。
    category = Category(name="キャンプ用品")
    session.add(category)
    session.flush()

    # 為替（現在レート）。
    session.add(ExchangeRate(base_currency="CNY", quote_currency="JPY", rate=21.0, kind="current", checked_at=now))

    # 既定コストルール（economics の定数と対応）。
    for tier in (SizeTier.S, SizeTier.M, SizeTier.L):
        session.add(
            CostRule(
                name=f"default-{tier.value}",
                size_tier=tier.value,
                intl_shipping={"S": 800, "M": 1600, "L": 3200}[tier.value],
                domestic_shipping={"S": 500, "M": 700, "L": 1200}[tier.value],
                import_tax_rate=IMPORT_TAX_RATE,
                platform_fee_rate=PLATFORM_FEE_RATE,
                other_rate=OTHER_RATE,
                packaging=PACKAGING[tier],
            )
        )

    counts = {
        "products": 0,
        "market_prices": 0,
        "price_history": 0,
        "opportunities": 0,
        "profit_calculations": 0,
        "seasonal_profiles": 0,
    }

    for entry in PRODUCT_CATALOG:
        # 商流方向とスコアはエンジンで計算し、その方向の利益を保存する（STEP 12-13）。
        best = opportunity_engine.evaluate(entry).best
        economics = best.economics

        session.add(
            Product(
                id=entry.id,
                name=entry.name,
                brand=entry.brand,
                category_id=category.id,
                sub_category=entry.sub_category,
                model=entry.model,
                size_tier=entry.size_tier.value,
                best_direction=entry.best_direction.value,
                seasonality=entry.seasonality.value,
                risk=entry.risk.value,
                match_type=entry.match_type.value,
                match_confidence=entry.match_confidence,
                score=entry.score,
                image_url=entry.image_url,
                source=SEED_SOURCE,
                retrieved_at=now,
            )
        )
        counts["products"] += 1

        for market, snap in (("JP", entry.japan), ("CN", entry.china)):
            session.add(
                MarketPrice(
                    product_id=entry.id,
                    market=market,
                    normalized_price=snap.price,
                    original_price=float(snap.price),
                    currency="JPY",
                    competitors=snap.competitors,
                    demand_index=snap.demand_index,
                    review_count=snap.review_count,
                    source=SEED_SOURCE,
                    checked_at=now,
                )
            )
            counts["market_prices"] += 1

            # 価格・需要の月次履歴（Phase 2）。合成時系列を投入する。
            for point in synthetic_series(
                entry.id, market, snap.price, snap.demand_index, entry.seasonality.value, now.year, now.month
            ):
                session.add(
                    PriceHistory(
                        product_id=entry.id,
                        market=market,
                        price=point.price,
                        demand_index=point.demand,
                        source=SEED_SOURCE,
                        recorded_at=datetime(point.year, point.month, 1, tzinfo=timezone.utc),
                    )
                )
                counts["price_history"] += 1

        session.add(
            ProfitCalculation(
                product_id=entry.id,
                direction=best.direction.value,
                sell_price=economics.sell_price,
                purchase_price=economics.cost.purchase_price,
                total_cost=economics.total_cost,
                estimated_profit=economics.estimated_profit,
                margin_rate=economics.margin_rate,
                roi=economics.roi,
                break_even_sell_price=economics.break_even_sell_price,
                cost_breakdown=economics.cost.model_dump(by_alias=True),
                calculated_at=now,
            )
        )
        counts["profit_calculations"] += 1

        session.add(
            OpportunityRecord(
                product_id=entry.id,
                direction=best.direction.value,
                score=best.score,
                estimated_profit=economics.estimated_profit,
                margin_rate=economics.margin_rate,
                price_gap_rate=price_gap_rate(entry),
                seasonality=entry.seasonality.value,
                risk=entry.risk.value,
                reasons=[r.value for r in derive_reasons(entry, best.direction, economics)],
                computed_at=now,
            )
        )
        counts["opportunities"] += 1

        if entry.seasonality != Season.ALL_YEAR:
            peak_month = SEASON_PEAK_MONTH[entry.seasonality]
            session.add(
                SeasonalProfile(
                    product_id=entry.id,
                    country="JP",
                    season=entry.seasonality.value,
                    peak_month=peak_month,
                    recommended_buy_month=((peak_month - 2 + 11) % 12) + 1,
                )
            )
            counts["seasonal_profiles"] += 1

    session.commit()
    return counts
