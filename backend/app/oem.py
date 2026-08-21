"""OEM 分析エンジン（Phase 2, docs/development_plan.md セクション 41・88 の 15）。

ブランド有無・マッチタイプ・価格差・中国側の供給規模・ブランド信号の弱さから、
その商品が OEM/ノーブランド由来である可能性を決定論的にスコア化する（原則: セクション 93）。
実データ接続後は、複数出品の重複・工場出荷情報等でシグナルを強化する想定。
"""

from __future__ import annotations

from .catalog import CatalogEntry
from .economics import price_gap_rate
from .opportunity_engine import _SUPPLY_STABILITY, _clamp01
from .schemas import MatchType, OemAnalysis, OemSignal

# ブランドを持たない/OEM とみなす表記。
_OEM_BRANDS = {"", "oem", "no brand", "ノーブランド", "ノーブランド品"}

# シグナル重み（合計 1.0）。
_WEIGHTS = {
    "no_brand": 0.30,
    "oem_match_type": 0.25,
    "large_price_gap": 0.20,
    "mass_production": 0.15,
    "weak_brand_signal": 0.10,
}

# しきい値。これを超えたシグナルを根拠として提示する。
_MASS_PRODUCTION_COMPETITORS = 100
_LARGE_PRICE_GAP = 1.0
_WEAK_BRAND_CONFIDENCE = 80


def _is_oem_brand(brand: str) -> bool:
    return brand.strip().lower() in _OEM_BRANDS


def _oem_match_factor(match_type: MatchType) -> float:
    if match_type == MatchType.OEM_CANDIDATE:
        return 1.0
    if match_type == MatchType.SIMILAR:
        return 0.6
    return 0.0


def analyze_oem(entry: CatalogEntry) -> OemAnalysis:
    """1 商品の OEM 可能性を分析する。"""
    no_brand = _is_oem_brand(entry.brand)
    gap = price_gap_rate(entry)

    factors = {
        "no_brand": 1.0 if no_brand else 0.0,
        "oem_match_type": _oem_match_factor(entry.match_type),
        "large_price_gap": _clamp01(gap / 2),
        "mass_production": _clamp01(entry.china.competitors / 200),
        "weak_brand_signal": _clamp01((100 - entry.match_confidence) / 100),
    }
    weighted = sum(_WEIGHTS[key] * value for key, value in factors.items())
    score = round(_clamp01(weighted) * 100)

    signals: list[OemSignal] = []
    if no_brand:
        signals.append(OemSignal.NO_BRAND)
    if entry.match_type in (MatchType.OEM_CANDIDATE, MatchType.SIMILAR):
        signals.append(OemSignal.OEM_MATCH_TYPE)
    if gap >= _LARGE_PRICE_GAP:
        signals.append(OemSignal.LARGE_PRICE_GAP)
    if entry.china.competitors >= _MASS_PRODUCTION_COMPETITORS:
        signals.append(OemSignal.MASS_PRODUCTION)
    if entry.match_confidence < _WEAK_BRAND_CONFIDENCE:
        signals.append(OemSignal.WEAK_BRAND_SIGNAL)

    verdict = "likely" if score >= 65 else "possible" if score >= 40 else "unlikely"

    return OemAnalysis(
        product_id=entry.id,
        score=score,
        verdict=verdict,
        supply_stability=_SUPPLY_STABILITY.get(entry.match_type, 0.5),
        signals=signals,
    )
