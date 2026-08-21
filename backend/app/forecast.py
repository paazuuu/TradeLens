"""価格予測・需要予測エンジン（Phase 2、docs/development_plan.md セクション 41・88）。

過去の時系列（price_history）から最小二乗法でトレンドを推定し、季節成分を重ねて
先 N か月を予測する。AI ではなく決定論的な統計手法で確定させる（原則: セクション 93）。
予測は参考値であり、信頼度（trend の当てはまり）を併記する。
"""

from __future__ import annotations

from dataclasses import dataclass

from .history import _seasonal_component, _shift_month

# 予測する先の月数。
FORECAST_MONTHS = 6


@dataclass(frozen=True)
class ForecastPoint:
    year: int
    month: int
    value: int


@dataclass(frozen=True)
class ForecastResult:
    points: list[ForecastPoint]
    slope_per_month: float  # 1 か月あたりの変化量（円 or 指数）。
    confidence: int  # 0-100。トレンドの当てはまり（決定係数 R^2 ベース）。


def _linear_fit(values: list[float]) -> tuple[float, float, float]:
    """x=0..n-1 に対する最小二乗直線 (slope, intercept, r_squared) を返す。"""
    n = len(values)
    if n < 2:
        return 0.0, (values[0] if values else 0.0), 0.0
    xs = list(range(n))
    mean_x = sum(xs) / n
    mean_y = sum(values) / n
    sxx = sum((x - mean_x) ** 2 for x in xs)
    sxy = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, values))
    slope = sxy / sxx if sxx else 0.0
    intercept = mean_y - slope * mean_x
    ss_tot = sum((y - mean_y) ** 2 for y in values)
    ss_res = sum((y - (slope * x + intercept)) ** 2 for x, y in zip(xs, values))
    r_squared = 1 - ss_res / ss_tot if ss_tot else 0.0
    return slope, intercept, max(0.0, r_squared)


def _forecast(
    values: list[float],
    months: list[int],
    seasonality: str,
    last_year: int,
    last_month: int,
    seasonal_amplitude: float,
    horizon: int,
    lower: int,
    upper: int | None,
) -> ForecastResult:
    """時系列から先 horizon か月を予測する共通ロジック。"""
    slope, intercept, r_squared = _linear_fit(values)
    n = len(values)
    # 直近の季節成分を差し引いた基準線からトレンドを延長し、将来月の季節成分を再付与する。
    points: list[ForecastPoint] = []
    for step in range(1, horizon + 1):
        year, month = _shift_month(last_year, last_month, step)
        trend = slope * (n - 1 + step) + intercept
        seasonal = _seasonal_component(month, seasonality) * seasonal_amplitude
        value = round(trend + seasonal)
        value = max(lower, value)
        if upper is not None:
            value = min(upper, value)
        points.append(ForecastPoint(year=year, month=month, value=value))
    return ForecastResult(points=points, slope_per_month=round(slope, 2), confidence=round(r_squared * 100))


def forecast_price(
    prices: list[int],
    months_of_year: list[int],
    seasonality: str,
    last_year: int,
    last_month: int,
    horizon: int = FORECAST_MONTHS,
) -> ForecastResult:
    """価格の先読み。季節振幅は直近価格の 8%。"""
    amplitude = (prices[-1] * 0.08) if prices else 0.0
    return _forecast(
        [float(p) for p in prices], months_of_year, seasonality, last_year, last_month, amplitude, horizon, 1, None
    )


def forecast_demand(
    demand: list[int],
    months_of_year: list[int],
    seasonality: str,
    last_year: int,
    last_month: int,
    horizon: int = FORECAST_MONTHS,
) -> ForecastResult:
    """需要指数の先読み。0-100 にクランプ、季節振幅は 12 ポイント。"""
    return _forecast(
        [float(d) for d in demand], months_of_year, seasonality, last_year, last_month, 12.0, horizon, 0, 100
    )
