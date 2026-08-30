"""中日市場のキーワード差分析（Phase 2, docs/development_plan.md セクション 41）。

商品名から再出現する文字 n-gram をキーワードとして抽出し、そのキーワードを含む商品群の
日本市場・中国市場の「市場強度」（需要・レビュー・競合から算出）を比較する。差が大きい
キーワードは、片側の市場で強く他方で手薄＝商機を示す。決定論的に確定し（原則: セクション 93）、
生成式はフロント（keywords.ts）と一致させる。
"""

from __future__ import annotations

from statistics import mean

from .catalog import CatalogEntry
from .schemas import KeywordGap, MarketSnapshot

# 抽出する n-gram の長さ範囲と、再出現とみなす最小文書頻度。
# 2 文字は語境界をまたぐ断片ノイズ（カー・ンタ等）が多いため 3 文字以上とする。
_MIN_LEN = 3
_MAX_LEN = 5
_MIN_DOC_FREQ = 2
# バイアス判定のしきい値（強度差）。
_BIAS_THRESHOLD = 8
# 返すキーワードの上限。
_MAX_KEYWORDS = 12


def _substrings(name: str) -> set[str]:
    """名前から長さ _MIN_LEN.._MAX_LEN の部分文字列集合を返す。"""
    cleaned = name.replace(" ", "").replace("　", "")
    result: set[str] = set()
    length = len(cleaned)
    for size in range(_MIN_LEN, _MAX_LEN + 1):
        for start in range(length - size + 1):
            result.add(cleaned[start : start + size])
    return result


def _document_frequencies(entries: list[CatalogEntry]) -> dict[str, int]:
    freq: dict[str, int] = {}
    for entry in entries:
        for sub in _substrings(entry.name):
            freq[sub] = freq.get(sub, 0) + 1
    return freq


def _extract_keywords(entries: list[CatalogEntry]) -> list[str]:
    """再出現する n-gram のうち、より長い同頻度語に包含されない代表語を返す。"""
    freq = _document_frequencies(entries)
    candidates = [sub for sub, count in freq.items() if count >= _MIN_DOC_FREQ]
    # 長い順・辞書順で走査し、同頻度でより長い採用済み語に含まれる短い語は捨てる。
    candidates.sort(key=lambda s: (-len(s), s))
    kept: list[str] = []
    for candidate in candidates:
        redundant = any(candidate in k and freq[k] == freq[candidate] and len(k) > len(candidate) for k in kept)
        if not redundant:
            kept.append(candidate)
    return kept


def _side_strength(snap: MarketSnapshot) -> float:
    """1 市場の強度（0-100）。需要中心、レビューで加点、競合で減点。"""
    review_score = min(100.0, snap.review_count / 20)
    competition_penalty = min(30.0, snap.competitors * 0.15)
    raw = snap.demand_index * 0.7 + review_score * 0.3 - competition_penalty
    return max(0.0, min(100.0, raw))


def _bias(gap: int) -> str:
    if gap >= _BIAS_THRESHOLD:
        return "jp"
    if gap <= -_BIAS_THRESHOLD:
        return "cn"
    return "balanced"


def keyword_gaps(entries: list[CatalogEntry]) -> list[KeywordGap]:
    """キーワードごとの日中市場強度差を、差の大きい順に返す。"""
    keywords = _extract_keywords(entries)
    gaps: list[KeywordGap] = []
    for keyword in keywords:
        matched = [e for e in entries if keyword in e.name.replace(" ", "").replace("　", "")]
        if not matched:
            continue
        jp_strength = round(mean(_side_strength(e.japan) for e in matched))
        cn_strength = round(mean(_side_strength(e.china) for e in matched))
        gap = jp_strength - cn_strength
        gaps.append(
            KeywordGap(
                keyword=keyword,
                product_count=len(matched),
                jp_strength=jp_strength,
                cn_strength=cn_strength,
                gap=gap,
                bias=_bias(gap),
            )
        )

    gaps.sort(key=lambda g: (-abs(g.gap), -g.product_count, g.keyword))
    return gaps[:_MAX_KEYWORDS]
