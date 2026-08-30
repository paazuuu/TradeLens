"""画像比較（Phase 2, docs/development_plan.md セクション 41）。

MVP+ 段階では商品画像を取得していないため、マッチ信頼度・マッチタイプから
「推定画像一致度」を決定論的に導く（原則: セクション 93）。実画像接続後は、
知覚ハッシュ/特徴量比較へ差し替える。推定であることを images_available=False で明示する。
"""

from __future__ import annotations

from .catalog import CatalogEntry
from .history import unit_noise
from .schemas import ImageComparison, MatchType

_TYPE_ADJUST = {
    MatchType.EXACT: 6,
    MatchType.MODEL_MATCH: 3,
    MatchType.BRAND_MATCH: 0,
    MatchType.OEM_CANDIDATE: -4,
    MatchType.SIMILAR: -8,
    MatchType.UNMATCHED: -20,
}


def _clamp(low: int, high: int, value: int) -> int:
    return max(low, min(high, value))


def compare_images(entry: CatalogEntry) -> ImageComparison:
    """日中出品の推定画像一致度を返す（画像未取得時のメタデータ推定）。"""
    adjust = _TYPE_ADJUST.get(entry.match_type, -10)
    noise = unit_noise(f"{entry.id}:image") * 4
    similarity = _clamp(0, 100, round(entry.match_confidence + adjust + noise))

    if similarity >= 85:
        verdict = "sameProduct"
    elif similarity >= 65:
        verdict = "likelySame"
    else:
        verdict = "different"

    return ImageComparison(
        product_id=entry.id,
        images_available=entry.image_url is not None,
        jp_image_url=entry.image_url,
        cn_image_url=None,
        similarity=similarity,
        verdict=verdict,
    )
