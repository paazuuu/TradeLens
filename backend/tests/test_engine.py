"""Opportunity / Profit エンジンの決定論的挙動を検証する（DB 非依存の単体テスト）。"""

from __future__ import annotations

from app import opportunity_engine
from app.catalog import PRODUCT_CATALOG
from app.economics import DEFAULT_COST_PARAMS, derive_economics_for, price_gap_rate
from app.schemas import TradeDirection


def test_scores_are_deterministic_and_bounded() -> None:
    for entry in PRODUCT_CATALOG:
        first = opportunity_engine.evaluate(entry).best.score
        second = opportunity_engine.evaluate(entry).best.score
        assert first == second, "同一入力で同一スコアであること"
        assert 0 <= first <= 100


def test_best_direction_is_the_higher_scoring_side() -> None:
    for entry in PRODUCT_CATALOG:
        ev = opportunity_engine.evaluate(entry)
        assert ev.best.score == max(ev.jp_to_cn.score, ev.cn_to_jp.score)
        assert ev.best.direction in (TradeDirection.JP_TO_CN, TradeDirection.CN_TO_JP)


def test_economics_profit_is_sell_minus_total_cost() -> None:
    entry = PRODUCT_CATALOG[0]
    econ = derive_economics_for(entry, TradeDirection.CN_TO_JP, DEFAULT_COST_PARAMS)
    assert econ.estimated_profit == econ.sell_price - econ.total_cost
    assert econ.break_even_sell_price == econ.total_cost


def test_price_gap_rate_is_non_negative() -> None:
    for entry in PRODUCT_CATALOG:
        assert price_gap_rate(entry) >= 0.0


def test_higher_costs_reduce_profit() -> None:
    from dataclasses import replace

    entry = PRODUCT_CATALOG[0]
    base = derive_economics_for(entry, TradeDirection.CN_TO_JP, DEFAULT_COST_PARAMS)
    pricier = replace(DEFAULT_COST_PARAMS, platform_fee_rate=DEFAULT_COST_PARAMS.platform_fee_rate + 0.2)
    raised = derive_economics_for(entry, TradeDirection.CN_TO_JP, pricier)
    assert raised.estimated_profit < base.estimated_profit
