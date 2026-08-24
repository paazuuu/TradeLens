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


# ---- Phase 2: 価格履歴・予測 --------------------------------------------


def test_synthetic_series_is_deterministic_and_anchored() -> None:
    from app.history import synthetic_series

    first = synthetic_series("opp-001", "JP", 4980, 82, "Summer", 2026, 8)
    second = synthetic_series("opp-001", "JP", 4980, 82, "Summer", 2026, 8)
    assert [p.price for p in first] == [p.price for p in second], "決定論的であること"
    assert len(first) == 12
    # 最新点は現在値に一致する。
    assert first[-1].price == 4980 and first[-1].demand == 82
    assert first[-1].year == 2026 and first[-1].month == 8
    # 需要は 0-100 に収まる。
    assert all(0 <= p.demand <= 100 for p in first)


def test_linear_fit_recovers_perfect_line() -> None:
    from app.forecast import _linear_fit

    slope, intercept, r2 = _linear_fit([10.0, 20.0, 30.0, 40.0])
    assert round(slope, 6) == 10.0
    assert round(intercept, 6) == 10.0
    assert round(r2, 6) == 1.0


def test_forecast_price_horizon_and_bounds() -> None:
    from app.forecast import forecast_price

    prices = [100, 110, 120, 130, 140, 150]
    months = [3, 4, 5, 6, 7, 8]
    result = forecast_price(prices, months, "AllYear", 2026, 8, horizon=6)
    assert len(result.points) == 6
    assert all(p.value >= 1 for p in result.points)
    # 上昇系列なので傾きは正。
    assert result.slope_per_month > 0


# ---- 実データ接続: HTTP アダプタ雛形 ------------------------------------


def test_http_source_unconfigured_returns_empty(monkeypatch) -> None:
    from app.datasources.http_source import HttpDataSource

    monkeypatch.delenv("DATA_SOURCE_URL", raising=False)
    source = HttpDataSource()
    assert source.configured is False
    assert source.fetch("camping") == []


def test_http_source_maps_and_skips_records() -> None:
    from app.datasources.http_source import HttpDataSource
    from app.schemas import SizeTier

    source = HttpDataSource()
    good = {
        "id": "sku-1",
        "name": "折りたたみランタン",
        "brand": "OEM",
        "category": "キャンプ用品",
        "subCategory": "LEDランタン",
        "sizeTier": "S",
        "japan": {"price": 4980, "currency": "JPY", "demandIndex": 80},
        "china": {"price": 90, "currency": "CNY", "demandIndex": 55},
    }
    mapped = source._map_record(good)
    assert mapped is not None
    assert mapped.id == "sku-1"
    assert mapped.size_tier == SizeTier.S
    # 中国価格は通貨を保持して返す（正規化は ingest 側）。
    assert mapped.china.price == 90 and mapped.china.currency == "CNY"
    # 必須項目を欠くレコードは読み飛ばす。
    assert source._map_record({"name": "no id"}) is None
