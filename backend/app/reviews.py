"""レビュー分析（Phase 2, docs/development_plan.md セクション 41）。

実レビュー本文が無い MVP+ 段階では、需要・リスク・レビュー件数・マッチ信頼度から
決定論的にセンチメントと観点別評価を合成する（原則: セクション 93）。生成式はフロント
（reviews.ts）と一致させ、FNV-1a 由来の擬似乱数で実行ごとに変化しない。実レビュー接続後は
本エンジンを本文からの集計へ差し替える。
"""

from __future__ import annotations

from .catalog import CatalogEntry
from .economics import price_gap_rate
from .history import unit_noise
from .schemas import ReviewAnalysis, ReviewAspect, TradeDirection

# 観点コード（i18n はフロント辞書側で解決）。
_ASPECTS = ["quality", "price", "delivery", "durability", "design", "usability"]

_RISK_ADJ = {"Low": 10, "Medium": 0, "High": -12}


def _clamp(low: int, high: int, value: int) -> int:
    return max(low, min(high, value))


def _sell_demand(entry: CatalogEntry, direction: TradeDirection) -> int:
    market = entry.japan if direction == TradeDirection.CN_TO_JP else entry.china
    return market.demand_index


def analyze_reviews(entry: CatalogEntry, direction: TradeDirection) -> ReviewAnalysis:
    """1 商品のレビュー・センチメントを合成する。"""
    demand = _sell_demand(entry, direction)
    risk_adj = _RISK_ADJ.get(entry.risk.value, 0)
    base_noise = unit_noise(f"{entry.id}:review:overall") * 6
    overall = _clamp(30, 95, round(55 + (demand - 60) * 0.4 + risk_adj + base_noise))

    positive = _clamp(0, 100, round(overall * 0.9))
    negative = _clamp(0, 100, round((100 - overall) * 0.7))
    neutral = _clamp(0, 100, 100 - positive - negative)

    sample_size = entry.japan.review_count + entry.china.review_count
    gap = price_gap_rate(entry)

    aspects: list[ReviewAspect] = []
    weight_total = 0.0
    weights: list[float] = []
    for aspect in _ASPECTS:
        # 観点別の基準補正。
        adjust = 0.0
        if aspect in ("quality", "durability"):
            adjust = risk_adj
        elif aspect == "price":
            adjust = min(15.0, gap * 8)
        elif aspect == "usability":
            adjust = (demand - 60) * 0.2
        noise = unit_noise(f"{entry.id}:review:{aspect}") * 8
        sentiment = _clamp(20, 98, round(overall + adjust + noise))
        weight = 0.6 + (unit_noise(f"{entry.id}:weight:{aspect}") + 1) / 2  # 0.6-1.6
        weights.append(weight)
        weight_total += weight
        aspects.append(ReviewAspect(aspect=aspect, sentiment=sentiment, mentions=0))

    # 言及数を重みで按分する（合計 = sample_size）。
    if weight_total > 0 and sample_size > 0:
        for aspect_out, weight in zip(aspects, weights):
            aspect_out.mentions = round(sample_size * weight / weight_total)

    return ReviewAnalysis(
        product_id=entry.id,
        overall=overall,
        positive=positive,
        neutral=neutral,
        negative=negative,
        sample_size=sample_size,
        aspects=aspects,
    )
