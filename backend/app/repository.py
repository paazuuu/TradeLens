"""DB からドメインエンティティを読み出すリポジトリ（STEP 15: DB結線）。

products + market_prices から CatalogEntry を再構成する。以降の集計・利益計算は
決定論的な services / economics 層を再利用する（DB を単一の真実に、計算はコードで確定）。
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .catalog import CatalogEntry
from .economics import DEFAULT_COST_PARAMS, CostParams
from .models import AppSetting, CostRule, PriceHistory, Product
from .models import ResearchJob as ResearchJobRow
from .schemas import (
    MarketSnapshot,
    MatchType,
    ResearchJob,
    ResearchOptions,
    ResearchResult,
    RiskLevel,
    Season,
    SizeTier,
    TradeDirection,
)


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


def load_cost_params(session: Session) -> CostParams:
    """DB の cost_rules から Profit Engine のコストパラメータを構築する（STEP 10-11）。

    サイズ帯別の送料・梱包費と、共通の税率・手数料率を組み立てる。
    行が無ければ既定パラメータを返す。

    グローバル設定（app_settings）が存在する場合はそれを優先し、送料は全サイズ帯へ
    一律適用する（UI-012 の簡易設定に合わせる）。梱包費は既定の帯別値を維持する。
    """
    setting = session.get(AppSetting, 1)
    if setting is not None:
        flat_intl = {tier: setting.intl_shipping for tier in SizeTier}
        flat_domestic = {tier: setting.domestic_shipping for tier in SizeTier}
        return CostParams(
            intl_shipping=flat_intl,
            domestic_shipping=flat_domestic,
            packaging=dict(DEFAULT_COST_PARAMS.packaging),
            import_tax_rate=setting.import_tax_rate / 100,
            platform_fee_rate=setting.platform_fee_rate / 100,
            other_rate=DEFAULT_COST_PARAMS.other_rate,
        )

    rules = session.scalars(select(CostRule).where(CostRule.size_tier.is_not(None))).all()
    if not rules:
        return DEFAULT_COST_PARAMS

    intl: dict[SizeTier, int] = dict(DEFAULT_COST_PARAMS.intl_shipping)
    domestic: dict[SizeTier, int] = dict(DEFAULT_COST_PARAMS.domestic_shipping)
    packaging: dict[SizeTier, int] = dict(DEFAULT_COST_PARAMS.packaging)
    import_tax_rate = DEFAULT_COST_PARAMS.import_tax_rate
    platform_fee_rate = DEFAULT_COST_PARAMS.platform_fee_rate
    other_rate = DEFAULT_COST_PARAMS.other_rate

    for rule in rules:
        try:
            tier = SizeTier(rule.size_tier)
        except ValueError:
            continue
        intl[tier] = rule.intl_shipping
        domestic[tier] = rule.domestic_shipping
        packaging[tier] = rule.packaging
        import_tax_rate = rule.import_tax_rate
        platform_fee_rate = rule.platform_fee_rate
        other_rate = rule.other_rate

    return CostParams(
        intl_shipping=intl,
        domestic_shipping=domestic,
        packaging=packaging,
        import_tax_rate=import_tax_rate,
        platform_fee_rate=platform_fee_rate,
        other_rate=other_rate,
    )


# ---- Research jobs（STEP 5-6: 実行履歴の永続化）---------------------------


def save_research_job(
    session: Session,
    job_id: str,
    options: ResearchOptions,
    result: ResearchResult,
    user_id: str | None = None,
    status: str = "completed",
) -> ResearchJob:
    """リサーチ実行結果を research_jobs テーブルへ保存し、API スキーマを返す。"""
    row = ResearchJobRow(
        id=job_id,
        user_id=user_id,
        category=options.category,
        options=options.model_dump(mode="json"),
        status=status,
        products_analyzed=result.products_analyzed,
        opportunities_found=result.opportunities_found,
        jp_to_cn=result.jp_to_cn,
        cn_to_jp=result.cn_to_jp,
    )
    session.add(row)
    session.commit()
    return ResearchJob(id=row.id, status=row.status, options=options, result=result)


def load_price_history(session: Session, product_id: str, market: str) -> list[PriceHistory]:
    """指定商品・市場の価格履歴を古い順に読み出す。"""
    stmt = (
        select(PriceHistory)
        .where(PriceHistory.product_id == product_id, PriceHistory.market == market)
        .order_by(PriceHistory.recorded_at)
    )
    return list(session.scalars(stmt).all())


def load_research_job(session: Session, job_id: str) -> ResearchJob | None:
    """保存済みリサーチ結果を API スキーマとして読み出す。無ければ None。"""
    row = session.get(ResearchJobRow, job_id)
    if row is None:
        return None
    options = ResearchOptions.model_validate(row.options) if row.options else ResearchOptions(category=row.category)
    result = ResearchResult(
        products_analyzed=row.products_analyzed,
        opportunities_found=row.opportunities_found,
        jp_to_cn=row.jp_to_cn,
        cn_to_jp=row.cn_to_jp,
    )
    return ResearchJob(id=row.id, status=row.status, options=options, result=result)
