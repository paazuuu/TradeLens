"""Opportunity Engine + Direction Engine（STEP 12-13）。

各商品について 日本→中国 / 中国→日本 の Opportunity Score を別々に計算し、
高い方を BEST_DIRECTION とする。スコアは docs/development_plan.md セクション 11 の
重み付き要素（利益率・利益額・需要・価格差・競合・仕入安定性・季節性・リスク・為替安定性）
から決定論的に算出する。認証や外部データではなく、DB の生シグナルから導く（原則: セクション 93）。
"""

from __future__ import annotations

from dataclasses import dataclass

from .catalog import CatalogEntry
from .economics import CostParams, DEFAULT_COST_PARAMS, derive_economics_for, price_gap_rate
from .schemas import Economics, MatchType, RiskLevel, Season, TradeDirection

# セクション 11 の初期スコア重み（合計 1.0）。
WEIGHTS = {
    "profit_rate": 0.25,
    "profit_amount": 0.20,
    "demand": 0.15,
    "price_gap": 0.10,
    "low_competition": 0.10,
    "supply_stability": 0.05,
    "seasonality": 0.05,
    "risk": 0.05,
    "fx_stability": 0.05,
}

_SUPPLY_STABILITY = {
    MatchType.EXACT: 1.0,
    MatchType.MODEL_MATCH: 0.9,
    MatchType.BRAND_MATCH: 0.8,
    MatchType.OEM_CANDIDATE: 0.7,
    MatchType.SIMILAR: 0.6,
    MatchType.UNMATCHED: 0.3,
}

_RISK_SCORE = {RiskLevel.LOW: 1.0, RiskLevel.MEDIUM: 0.6, RiskLevel.HIGH: 0.3}


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


@dataclass(frozen=True)
class DirectionScore:
    direction: TradeDirection
    score: int
    economics: Economics


@dataclass(frozen=True)
class Evaluation:
    best: DirectionScore
    jp_to_cn: DirectionScore
    cn_to_jp: DirectionScore


def _score_direction(entry: CatalogEntry, direction: TradeDirection, params: CostParams) -> DirectionScore:
    economics = derive_economics_for(entry, direction, params)
    sell_market = entry.japan if direction == TradeDirection.CN_TO_JP else entry.china

    factors = {
        # 利益率 40% で満点。
        "profit_rate": _clamp01(economics.margin_rate / 0.4),
        # 利益額 5,000 円で満点。
        "profit_amount": _clamp01(economics.estimated_profit / 5000),
        "demand": _clamp01(sell_market.demand_index / 100),
        # 価格差 200% で満点。
        "price_gap": _clamp01(price_gap_rate(entry) / 2),
        # 競合 0 で満点、200 で 0。
        "low_competition": _clamp01(1 - sell_market.competitors / 200),
        "supply_stability": _SUPPLY_STABILITY.get(entry.match_type, 0.5),
        # 季節商品は季節需要の上振れ余地を加点。
        "seasonality": 1.0 if entry.seasonality != Season.ALL_YEAR else 0.6,
        "risk": _RISK_SCORE.get(entry.risk, 0.6),
        # 為替安定性は暫定定数（将来 exchange_rates の変動から算出）。
        "fx_stability": 0.8,
    }

    weighted = sum(WEIGHTS[key] * value for key, value in factors.items())
    score = round(_clamp01(weighted) * 100)
    return DirectionScore(direction=direction, score=score, economics=economics)


def evaluate(entry: CatalogEntry, params: CostParams = DEFAULT_COST_PARAMS) -> Evaluation:
    """両方向を評価し、最良方向を決定する。"""
    jp = _score_direction(entry, TradeDirection.JP_TO_CN, params)
    cn = _score_direction(entry, TradeDirection.CN_TO_JP, params)
    best = jp if jp.score >= cn.score else cn
    return Evaluation(best=best, jp_to_cn=jp, cn_to_jp=cn)
