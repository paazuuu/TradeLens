"""ブランド・競合分析（Phase 2, docs/development_plan.md セクション 41）。

カタログをブランド単位で集計し、平均スコア・利益率・推定利益合計・競合水準・OEM 比率・
優勢な商流方向を決定論的に導く（原則: セクション 93）。競合水準は販売市場側の平均競合数
から段階化する。
"""

from __future__ import annotations

from statistics import mean

from . import opportunity_engine
from .catalog import CatalogEntry
from .oem import _is_oem_brand
from .schemas import BrandStat, TradeDirection

# 競合水準の境界（販売市場の平均競合数）。
_LOW_COMPETITION = 40
_MEDIUM_COMPETITION = 100


def _competition_level(avg_competitors: float) -> str:
    if avg_competitors <= _LOW_COMPETITION:
        return "low"
    if avg_competitors <= _MEDIUM_COMPETITION:
        return "medium"
    return "high"


def brand_analysis(entries: list[CatalogEntry]) -> list[BrandStat]:
    """ブランド別の集計を推定利益合計の降順で返す。"""
    by_brand: dict[str, list[CatalogEntry]] = {}
    for entry in entries:
        by_brand.setdefault(entry.brand, []).append(entry)

    stats: list[BrandStat] = []
    for brand, items in by_brand.items():
        evaluations = [opportunity_engine.evaluate(e).best for e in items]
        # 販売市場側の競合数（有望方向に応じて日本/中国を選ぶ）。
        sell_competitors = [
            (e.japan.competitors if best.direction == TradeDirection.CN_TO_JP else e.china.competitors)
            for e, best in zip(items, evaluations)
        ]
        export_count = sum(1 for best in evaluations if best.direction == TradeDirection.JP_TO_CN)
        import_count = len(evaluations) - export_count
        dominant: TradeDirection | None = None
        if export_count > import_count:
            dominant = TradeDirection.JP_TO_CN
        elif import_count > export_count:
            dominant = TradeDirection.CN_TO_JP

        avg_competitors = round(mean(sell_competitors))
        stats.append(
            BrandStat(
                brand=brand,
                product_count=len(items),
                avg_score=round(mean(best.score for best in evaluations)),
                avg_margin_rate=round(mean(best.economics.margin_rate for best in evaluations), 4),
                total_estimated_profit=sum(best.economics.estimated_profit for best in evaluations),
                avg_competitors=avg_competitors,
                competition_level=_competition_level(avg_competitors),
                oem_share=round(sum(1 for e in items if _is_oem_brand(e.brand)) / len(items), 4),
                dominant_direction=dominant,
            )
        )

    return sorted(stats, key=lambda s: s.total_estimated_profit, reverse=True)
