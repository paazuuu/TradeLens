"""DB からドメインエンティティを読み出すリポジトリ（STEP 15: DB結線）。

products + market_prices から CatalogEntry を再構成する。以降の集計・利益計算は
決定論的な services / economics 層を再利用する（DB を単一の真実に、計算はコードで確定）。
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .catalog import CatalogEntry
from .models import Product
from .schemas import MarketSnapshot, MatchType, RiskLevel, Season, SizeTier, TradeDirection


def _snapshot(prices: dict[str, "MarketPriceRow"], market: str) -> MarketSnapshot:
    row = prices.get(market)
    if row is None:
        return MarketSnapshot(price=0, competitors=0, demand_index=0, review_count=0)
    return MarketSnapshot(
        price=row.normalized_price,
        competitors=row.competitors or 0,
        demand_index=row.demand_index or 0,
        review_count=row.review_count or 0,
    )


class MarketPriceRow:  # 型ヒント用の薄いプロトコル代替（実体は ORM の MarketPrice）
    normalized_price: int
    competitors: int | None
    demand_index: int | None
    review_count: int | None


def _to_catalog_entry(product: Product) -> CatalogEntry:
    prices = {mp.market: mp for mp in product.market_prices}
    return CatalogEntry(
        id=product.id,
        name=product.name,
        brand=product.brand,
        category=product.category.name if product.category else "",
        sub_category=product.sub_category,
        model=product.model,
        size_tier=SizeTier(product.size_tier),
        best_direction=TradeDirection(product.best_direction),
        seasonality=Season(product.seasonality),
        risk=RiskLevel(product.risk),
        match_type=MatchType(product.match_type),
        match_confidence=product.match_confidence,
        score=product.score,
        image_url=product.image_url,
        japan=_snapshot(prices, "JP"),
        china=_snapshot(prices, "CN"),
    )


def load_catalog(session: Session) -> list[CatalogEntry]:
    """DB の全商品を CatalogEntry のリストとして読み出す。"""
    stmt = (
        select(Product)
        .options(selectinload(Product.market_prices), selectinload(Product.category))
        .order_by(Product.id)
    )
    products = session.scalars(stmt).all()
    return [_to_catalog_entry(product) for product in products]


def catalog_is_empty(session: Session) -> bool:
    return session.scalar(select(Product.id).limit(1)) is None
