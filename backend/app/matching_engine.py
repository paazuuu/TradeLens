"""Matching Engine（STEP 9）。日本商品と中国商品を決定論的にマッチングする。

名前の類似度（difflib）・型番一致・ブランド一致のシグナルからマッチタイプと信頼度を算出する。
単純な商品名一致ではなく複数シグナルを組み合わせる（原則: セクション 7）。画像・JAN 等の
識別子や意味的類似は将来拡張（Phase 2）。
"""

from __future__ import annotations

from difflib import SequenceMatcher

from .schemas import MatchRequest, MatchResult, MatchSignals, MatchType


def _norm(value: str | None) -> str:
    return (value or "").strip().lower()


def _name_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def _is_oem(brand: str) -> bool:
    return brand in ("", "oem", "no brand", "ノーブランド")


def _classify(name_sim: float, model_match: bool, brand_match: bool, either_oem: bool) -> MatchType:
    if model_match and name_sim >= 0.5:
        return MatchType.EXACT if name_sim >= 0.9 else MatchType.MODEL_MATCH
    if name_sim >= 0.9:
        return MatchType.EXACT
    if brand_match and name_sim >= 0.4:
        return MatchType.BRAND_MATCH
    if name_sim >= 0.6:
        return MatchType.SIMILAR
    if either_oem and name_sim >= 0.3:
        return MatchType.OEM_CANDIDATE
    return MatchType.UNMATCHED


def match_products(req: MatchRequest) -> MatchResult:
    name_sim = _name_similarity(_norm(req.japan_name), _norm(req.china_name))
    jp_model, cn_model = _norm(req.japan_model), _norm(req.china_model)
    jp_brand, cn_brand = _norm(req.japan_brand), _norm(req.china_brand)

    model_match = bool(jp_model and cn_model and jp_model == cn_model)
    brand_match = bool(jp_brand and cn_brand and jp_brand == cn_brand and not _is_oem(jp_brand))
    either_oem = _is_oem(jp_brand) or _is_oem(cn_brand)

    match_type = _classify(name_sim, model_match, brand_match, either_oem)

    # 信頼度: 名前類似度を主軸に、型番/ブランド一致を加点。
    confidence = round(name_sim * 70 + (20 if model_match else 0) + (10 if brand_match else 0))
    confidence = max(0, min(100, confidence))

    return MatchResult(
        match_type=match_type,
        confidence=confidence,
        signals=MatchSignals(name_similarity=round(name_sim, 3), model_match=model_match, brand_match=brand_match),
    )
