"""価格履歴・予測のレスポンス組み立て（Phase 2, セクション 41・47）。

DB（price_history）に点があればそれを、無ければ catalog から決定論的に合成した
時系列を用いる。予測は forecast エンジンに委ね、有望方向の販売市場を対象とする。
純粋関数として実装し、DB アクセスは呼び出し側（endpoint）で行う。
"""

from __future__ import annotations

from datetime import datetime

from . import forecast
from .catalog import CatalogEntry
from .history import SeriesPoint, synthetic_series
from .models import PriceHistory
from .schemas import (
    ForecastPoint,
    ForecastSeries,
    PriceHistoryResponse,
    ProductForecastResponse,
    TimeSeriesPoint,
    TradeDirection,
)


def _ym(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}"


def _series_for_market(
    entry: CatalogEntry, market: str, rows: list[PriceHistory], now: datetime
) -> list[SeriesPoint]:
    """DB 行があれば時系列へ変換し、無ければ現在値から合成する。"""
    if rows:
        return [
            SeriesPoint(
                year=row.recorded_at.year,
                month=row.recorded_at.month,
                price=row.price,
                demand=row.demand_index if row.demand_index is not None else 0,
            )
            for row in rows
        ]
    snap = entry.japan if market == "JP" else entry.china
    return synthetic_series(
        entry.id, market, snap.price, snap.demand_index, entry.seasonality.value, now.year, now.month
    )


def build_price_history(
    entry: CatalogEntry, jp_rows: list[PriceHistory], cn_rows: list[PriceHistory], now: datetime
) -> PriceHistoryResponse:
    jp = _series_for_market(entry, "JP", jp_rows, now)
    cn = _series_for_market(entry, "CN", cn_rows, now)
    return PriceHistoryResponse(
        product_id=entry.id,
        japan=[TimeSeriesPoint(date=_ym(p.year, p.month), price=p.price, demand=p.demand) for p in jp],
        china=[TimeSeriesPoint(date=_ym(p.year, p.month), price=p.price, demand=p.demand) for p in cn],
    )


def _to_series(result: forecast.ForecastResult) -> ForecastSeries:
    return ForecastSeries(
        points=[ForecastPoint(date=_ym(p.year, p.month), value=p.value) for p in result.points],
        slope_per_month=result.slope_per_month,
        confidence=result.confidence,
    )


def build_forecast(
    entry: CatalogEntry,
    best_direction: TradeDirection,
    sell_rows: list[PriceHistory],
    now: datetime,
) -> ProductForecastResponse:
    """有望方向の販売市場の履歴から価格・需要を予測する。"""
    market = "JP" if best_direction == TradeDirection.CN_TO_JP else "CN"
    series = _series_for_market(entry, market, sell_rows, now)
    prices = [p.price for p in series]
    demand = [p.demand for p in series]
    months = [p.month for p in series]
    last = series[-1]
    price_result = forecast.forecast_price(prices, months, entry.seasonality.value, last.year, last.month)
    demand_result = forecast.forecast_demand(demand, months, entry.seasonality.value, last.year, last.month)
    return ProductForecastResponse(
        product_id=entry.id,
        market=market,
        best_direction=best_direction,
        price_forecast=_to_series(price_result),
        demand_forecast=_to_series(demand_result),
    )
