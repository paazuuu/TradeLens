"""ORM モデル（docs/development_plan.md セクション 73 の初期テーブル）。

方言非依存の型のみを使用し、PostgreSQL と SQLite の双方で動作する。
外部ソース由来のデータには source / source_url / retrieved_at を持たせ、
AI 生成値と取得値を区別できるようにする（原則: セクション 94）。
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(200))
    # PBKDF2 ハッシュ（"pbkdf2_sha256$iterations$salt$hash"）。認証（STEP 19）。
    password_hash: Mapped[str | None] = mapped_column(String(255))


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))

    products: Mapped[list[Product]] = relationship(back_populates="category")


class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(400), nullable=False)
    brand: Mapped[str] = mapped_column(String(200), nullable=False)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    sub_category: Mapped[str] = mapped_column(String(200), nullable=False)
    model: Mapped[str] = mapped_column(String(200), nullable=False)
    size_tier: Mapped[str] = mapped_column(String(2), nullable=False)  # S / M / L
    best_direction: Mapped[str] = mapped_column(String(16), nullable=False)  # JP_TO_CN / CN_TO_JP
    seasonality: Mapped[str] = mapped_column(String(16), nullable=False)
    risk: Mapped[str] = mapped_column(String(16), nullable=False)
    match_type: Mapped[str] = mapped_column(String(24), nullable=False)
    match_confidence: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(1000))
    # データ品質メタ（セクション 94）。
    source: Mapped[str | None] = mapped_column(String(200))
    source_url: Mapped[str | None] = mapped_column(String(1000))
    retrieved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    category: Mapped[Category | None] = relationship(back_populates="products")
    market_prices: Mapped[list[MarketPrice]] = relationship(back_populates="product", cascade="all, delete-orphan")
    opportunities: Mapped[list[OpportunityRecord]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductMatch(Base, TimestampMixin):
    __tablename__ = "product_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    matched_ref: Mapped[str] = mapped_column(String(400), nullable=False)  # 対向商品の識別子/URL
    match_type: Mapped[str] = mapped_column(String(24), nullable=False)
    match_confidence: Mapped[int] = mapped_column(Integer, nullable=False)


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    market: Mapped[str] = mapped_column(String(2), nullable=False)  # JP / CN
    # 正規化後（円建て）と原価。
    normalized_price: Mapped[int] = mapped_column(Integer, nullable=False)
    original_price: Mapped[float | None] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="JPY")
    competitors: Mapped[int | None] = mapped_column(Integer)
    demand_index: Mapped[int | None] = mapped_column(Integer)
    review_count: Mapped[int | None] = mapped_column(Integer)
    source: Mapped[str | None] = mapped_column(String(200))
    source_url: Mapped[str | None] = mapped_column(String(1000))
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

    product: Mapped[Product] = relationship(back_populates="market_prices")


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    base_currency: Mapped[str] = mapped_column(String(8), nullable=False)  # CNY
    quote_currency: Mapped[str] = mapped_column(String(8), nullable=False)  # JPY
    rate: Mapped[float] = mapped_column(Float, nullable=False)
    kind: Mapped[str] = mapped_column(String(16), nullable=False, default="current")  # current/average/conservative
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)


class CostRule(Base, TimestampMixin):
    __tablename__ = "cost_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    size_tier: Mapped[str | None] = mapped_column(String(2))  # 適用サイズ帯（null=共通）
    intl_shipping: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    domestic_shipping: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    import_tax_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    platform_fee_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    other_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    packaging: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ProfitCalculation(Base):
    __tablename__ = "profit_calculations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    direction: Mapped[str] = mapped_column(String(16), nullable=False)
    sell_price: Mapped[int] = mapped_column(Integer, nullable=False)
    purchase_price: Mapped[int] = mapped_column(Integer, nullable=False)
    total_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_profit: Mapped[int] = mapped_column(Integer, nullable=False)
    margin_rate: Mapped[float] = mapped_column(Float, nullable=False)
    roi: Mapped[float] = mapped_column(Float, nullable=False)
    break_even_sell_price: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_breakdown: Mapped[dict | None] = mapped_column(JSON)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)


class OpportunityRecord(Base):
    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    direction: Mapped[str] = mapped_column(String(16), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_profit: Mapped[int] = mapped_column(Integer, nullable=False)
    margin_rate: Mapped[float] = mapped_column(Float, nullable=False)
    price_gap_rate: Mapped[float] = mapped_column(Float, nullable=False)
    seasonality: Mapped[str] = mapped_column(String(16), nullable=False)
    risk: Mapped[str] = mapped_column(String(16), nullable=False)
    reasons: Mapped[list | None] = mapped_column(JSON)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

    product: Mapped[Product] = relationship(back_populates="opportunities")


class SeasonalProfile(Base, TimestampMixin):
    __tablename__ = "seasonal_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id"), nullable=False)
    country: Mapped[str] = mapped_column(String(2), nullable=False, default="JP")  # 国別需要時期（セクション 14）
    season: Mapped[str] = mapped_column(String(16), nullable=False)
    peak_month: Mapped[int] = mapped_column(Integer, nullable=False)
    recommended_buy_month: Mapped[int] = mapped_column(Integer, nullable=False)


class ResearchJob(Base):
    __tablename__ = "research_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    category: Mapped[str] = mapped_column(String(200), nullable=False)
    options: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="pending")
    products_analyzed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    opportunities_found: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    jp_to_cn: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cn_to_jp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)


class Watchlist(Base, TimestampMixin):
    __tablename__ = "watchlists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    kind: Mapped[str] = mapped_column(String(16), nullable=False)  # category / product
    value: Mapped[str] = mapped_column(String(400), nullable=False)  # カテゴリー名 / product_id
    monitor_frequency: Mapped[str] = mapped_column(String(16), nullable=False, default="weekly")


class AppSetting(Base):
    """グローバル設定（シングルトン, id=1）。UI-012 Settings と対応（STEP 5 / セクション 66）。

    率はパーセントで保持し（例 5, 10, 20）、Profit Engine では /100 して用いる。
    """

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    exchange_rate: Mapped[float] = mapped_column(Float, nullable=False, default=21.0)
    intl_shipping: Mapped[int] = mapped_column(Integer, nullable=False, default=1600)
    domestic_shipping: Mapped[int] = mapped_column(Integer, nullable=False, default=700)
    import_tax_rate: Mapped[float] = mapped_column(Float, nullable=False, default=5.0)
    platform_fee_rate: Mapped[float] = mapped_column(Float, nullable=False, default=10.0)
    min_margin: Mapped[float] = mapped_column(Float, nullable=False, default=20.0)
    min_score: Mapped[int] = mapped_column(Integer, nullable=False, default=70)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id"))
    kind: Mapped[str] = mapped_column(String(24), nullable=False)  # opportunity / season
    payload: Mapped[dict | None] = mapped_column(JSON)
    message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
