"""価格・需要の時系列生成（Phase 2、docs/development_plan.md セクション 41・47）。

実データ蓄積前の MVP+ 段階では、現在価格・需要指数・季節性から決定論的に
過去 12 か月の合成時系列を生成し、price_history テーブルへ投入する（seed）。
生成式はフロント（src/lib/research/history.ts）と一致させ、API 有無に関わらず
同一のチャートを描く（整合性の原則: セクション 93）。

数値はすべて JPY（円）で保持する。ノイズは FNV-1a ハッシュ由来の決定論的擬似乱数で、
実行ごとに変化しない。
"""

from __future__ import annotations

from dataclasses import dataclass

# 季節ピークの代表月（services.SEASON_PEAK_MONTH と一致、AllYear は季節成分なし）。
_PEAK_MONTH: dict[str, int] = {"Spring": 4, "Summer": 7, "Autumn": 10, "Winter": 12}

# 生成する履歴の点数（か月）。最新点は現在値に一致させる。
HISTORY_MONTHS = 12

_FNV_OFFSET = 2166136261
_FNV_PRIME = 16777619
_UINT32 = 0xFFFFFFFF


def _fnv1a(key: str) -> int:
    """FNV-1a 32bit ハッシュ（ASCII キー前提。TS 実装と一致）。"""
    h = _FNV_OFFSET
    for ch in key.encode("utf-8"):
        h ^= ch
        h = (h * _FNV_PRIME) & _UINT32
    return h


def unit_noise(key: str) -> float:
    """キーから [-1, 1) の決定論的擬似乱数を返す（TS 実装と一致）。"""
    return (_fnv1a(key) / (_UINT32 + 1)) * 2 - 1


# 内部利用の別名（既存呼び出し互換）。
_unit_noise = unit_noise


def _seasonal_component(month: int, seasonality: str) -> float:
    """月と季節性から [-1, 1] の季節成分を返す。ピーク月で +1、対極で -1。"""
    peak = _PEAK_MONTH.get(seasonality)
    if peak is None:
        return 0.0
    raw = abs(month - peak)
    distance = min(raw, 12 - raw)  # 0..6
    return (3 - distance) / 3


@dataclass(frozen=True)
class SeriesPoint:
    """時系列 1 点。year/month は暦、price は JPY、demand は 0-100。"""

    year: int
    month: int
    price: int
    demand: int


def _shift_month(year: int, month: int, delta: int) -> tuple[int, int]:
    """(year, month) を delta か月ずらす（month は 1-12）。"""
    index = (year * 12 + (month - 1)) + delta
    return index // 12, index % 12 + 1


def synthetic_series(
    product_id: str,
    market: str,
    current_price: int,
    current_demand: int,
    seasonality: str,
    now_year: int,
    now_month: int,
    months: int = HISTORY_MONTHS,
) -> list[SeriesPoint]:
    """過去 months か月分の価格・需要時系列を決定論的に生成する（最新＝現在値）。"""
    points: list[SeriesPoint] = []
    last = months - 1
    for i in range(months):
        ages_ago = last - i
        year, month = _shift_month(now_year, now_month, -ages_ago)
        if i == last:
            points.append(SeriesPoint(year=year, month=month, price=current_price, demand=current_demand))
            continue

        seasonal = _seasonal_component(month, seasonality)
        drift = 0.01 * ages_ago  # 過去ほど安い緩やかな上昇トレンド（1%/月）。
        price_noise = _unit_noise(f"{product_id}:{market}:P:{i}") * 0.05
        price = round(current_price * (1 - drift + seasonal * 0.08 + price_noise))

        demand_noise = _unit_noise(f"{product_id}:{market}:D:{i}") * 6
        demand = round(current_demand + seasonal * 12 + demand_noise)
        demand = max(0, min(100, demand))
        points.append(SeriesPoint(year=year, month=month, price=max(1, price), demand=demand))
    return points
