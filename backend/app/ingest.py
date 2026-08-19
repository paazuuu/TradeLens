"""商品データの取り込み（STEP 8 / MVP-02 + 価格正規化 STEP 10）。

ProductImport を DB（categories / products / market_prices）へ upsert する。
中国価格（CNY）は DB の為替レートで円へ正規化し、原価・通貨・取得日時・取得元を保存する
（原則: セクション 94「取得値と AI 生成値を区別」）。
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .models import Category, ExchangeRate, MarketPrice, Product
from .schemas import IngestResponse, MarketPriceInput, ProductImport

_DEFAULT_RATE = 21.0


def _current_rate(session: Session) -> float:
    """最新の CNY→JPY レート。無ければ既定値。"""
    rate = session.scalar(
        select(ExchangeRate)
        .where(ExchangeRate.base_currency == "CNY", ExchangeRate.quote_currency == "JPY")
        .order_by(ExchangeRate.checked_at.desc())
    )
    return rate.rate if rate else _DEFAULT_RATE


def _normalized_jpy(price: float, currency: str, rate: float) -> int:
    """原通貨価格を円建てへ正規化する。"""
    if currency.upper() == "CNY":
        return round(price * rate)
    return round(price)


def _get_or_create_category(session: Session, name: str) -> Category:
    category = session.scalar(select(Category).where(Category.name == name))
    if category is None:
        category = Category(name=name)
        session.add(category)
        session.flush()
    return category


def _upsert_market_price(
    session: Session, product_id: str, market: str, snap: MarketPriceInput, rate: float, now: datetime
) -> None:
    session.execute(
        delete(MarketPrice).where(MarketPrice.product_id == product_id, MarketPrice.market == market)
    )
    session.add(
        MarketPrice(
            product_id=product_id,
            market=market,
            normalized_price=_normalized_jpy(snap.price, snap.currency, rate),
            original_price=snap.price,
            currency=snap.currency,
            competitors=snap.competitors,
            demand_index=snap.demand_index,
            review_count=snap.review_count,
            source=snap.source,
            source_url=snap.source_url,
            checked_at=now,
        )
    )


def import_products(session: Session, items: list[ProductImport], source: str = "import") -> IngestResponse:
    """商品レコードを DB へ upsert し、件数を返す。"""
    now = datetime.now(timezone.utc)
    rate = _current_rate(session)
    products = 0
    market_prices = 0

    for item in items:
        category = _get_or_create_category(session, item.category)

        product = session.get(Product, item.id)
        if product is None:
            product = Product(id=item.id)
            session.add(product)

        product.name = item.name
        product.brand = item.brand
        product.category_id = category.id
        product.sub_category = item.sub_category
        product.model = item.model
        product.size_tier = item.size_tier.value
        # best_direction は生シグナルの初期値。実際の方向はエンジンが計算する。
        product.best_direction = product.best_direction or "CN_TO_JP"
        product.seasonality = item.seasonality.value
        product.risk = item.risk.value
        product.match_type = item.match_type.value
        product.match_confidence = item.match_confidence if item.match_confidence is not None else 70
        product.score = product.score or 0
        product.image_url = item.image_url
        product.source = source
        product.retrieved_at = now
        products += 1

        _upsert_market_price(session, item.id, "JP", item.japan, rate, now)
        _upsert_market_price(session, item.id, "CN", item.china, rate, now)
        market_prices += 2

    session.commit()
    return IngestResponse(imported=len(items), products=products, market_prices=market_prices)
