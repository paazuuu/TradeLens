"""類似商品探索エンジン（Phase 2, docs/development_plan.md セクション 41）。

ある商品に対し、カタログ横断で類似・代替候補を決定論的に探索する。名前の類似は
文字バイグラムの Jaccard 係数を用い、difflib のような言語依存の実装を避けて
フロント（similar.ts）と一致させる（整合性の原則: セクション 93）。
"""

from __future__ import annotations

from . import opportunity_engine
from .catalog import CatalogEntry
from .oem import _is_oem_brand
from .schemas import SimilarProduct

# シグナル重み（合計 1.0）。
_WEIGHTS = {
    "sub_category": 0.40,
    "name_overlap": 0.25,
    "category": 0.10,
    "brand_rel": 0.10,
    "price_proximity": 0.10,
    "size": 0.05,
}


def _bigrams(text: str) -> set[str]:
    cleaned = text.replace(" ", "").replace("　", "")
    return {cleaned[i : i + 2] for i in range(len(cleaned) - 1)}


def _name_overlap(a: str, b: str) -> float:
    """文字バイグラムの Jaccard 係数（0-1）。"""
    ba, bb = _bigrams(a), _bigrams(b)
    if not ba or not bb:
        return 0.0
    inter = len(ba & bb)
    union = len(ba | bb)
    return inter / union if union else 0.0


def _price_proximity(a: int, b: int) -> float:
    top = max(a, b)
    if top <= 0:
        return 0.0
    return 1.0 - min(1.0, abs(a - b) / top)


def _brand_relation(a: CatalogEntry, b: CatalogEntry) -> float:
    if _is_oem_brand(a.brand) and _is_oem_brand(b.brand):
        return 1.0
    return 1.0 if a.brand.strip().lower() == b.brand.strip().lower() else 0.0


def _similarity(target: CatalogEntry, candidate: CatalogEntry) -> float:
    factors = {
        "sub_category": 1.0 if target.sub_category == candidate.sub_category else 0.0,
        "name_overlap": _name_overlap(target.name, candidate.name),
        "category": 1.0 if target.category == candidate.category else 0.0,
        "brand_rel": _brand_relation(target, candidate),
        "price_proximity": _price_proximity(target.japan.price, candidate.japan.price),
        "size": 1.0 if target.size_tier == candidate.size_tier else 0.0,
    }
    return sum(_WEIGHTS[key] * value for key, value in factors.items())


def find_similar(
    target: CatalogEntry, entries: list[CatalogEntry], limit: int = 5
) -> list[SimilarProduct]:
    """target に類似する商品を類似度降順で返す（自身を除く）。"""
    scored: list[tuple[float, CatalogEntry]] = []
    for candidate in entries:
        if candidate.id == target.id:
            continue
        scored.append((_similarity(target, candidate), candidate))
    scored.sort(key=lambda pair: pair[0], reverse=True)

    results: list[SimilarProduct] = []
    for similarity, candidate in scored[:limit]:
        best = opportunity_engine.evaluate(candidate).best
        results.append(
            SimilarProduct(
                id=candidate.id,
                name=candidate.name,
                brand=candidate.brand,
                sub_category=candidate.sub_category,
                similarity=round(similarity * 100),
                best_direction=best.direction,
                score=best.score,
                estimated_profit=best.economics.estimated_profit,
            )
        )
    return results
