"""モックデータソース。内蔵カタログを ProductImport として返す（取り込み経路の実証用）。

実運用では、正規 API / 許可されたデータ提供手段からのアダプタに置き換える。
"""

from __future__ import annotations

from ..catalog import PRODUCT_CATALOG
from ..schemas import MarketPriceInput, ProductImport


class MockDataSource:
    name = "mock"

    def fetch(self, query: str, limit: int = 20) -> list[ProductImport]:
        matched = [e for e in PRODUCT_CATALOG if not query or query in e.category or query in e.sub_category]
        items: list[ProductImport] = []
        for entry in matched[:limit]:
            items.append(
                ProductImport(
                    id=entry.id,
                    name=entry.name,
                    brand=entry.brand,
                    category=entry.category,
                    sub_category=entry.sub_category,
                    model=entry.model,
                    size_tier=entry.size_tier,
                    seasonality=entry.seasonality,
                    risk=entry.risk,
                    match_type=entry.match_type,
                    match_confidence=entry.match_confidence,
                    image_url=entry.image_url,
                    japan=MarketPriceInput(
                        market="JP",
                        price=float(entry.japan.price),
                        currency="JPY",
                        competitors=entry.japan.competitors,
                        demand_index=entry.japan.demand_index,
                        review_count=entry.japan.review_count,
                        source="mock",
                    ),
                    china=MarketPriceInput(
                        market="CN",
                        price=float(entry.china.price),
                        currency="JPY",
                        competitors=entry.china.competitors,
                        demand_index=entry.china.demand_index,
                        review_count=entry.china.review_count,
                        source="mock",
                    ),
                )
            )
        return items
