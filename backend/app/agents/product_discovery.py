"""Product Discovery Agent（STEP 8）。サブカテゴリー / 商品タイプから具体的な商品候補を生成する。

MVP では実データソースを持たないため、LLM が使えれば候補名を生成し、使えなければ
カタログ由来 + テンプレートでフォールバックする。ブランド品と OEM を区別する（セクション 6）。
価格や在庫などの取得値は含めない（それらは Product Discovery ではなく価格取得層の責務）。
"""

from __future__ import annotations

from ..catalog import PRODUCT_CATALOG
from . import llm
from .schemas import ProductCandidate

_SYSTEM_PROMPT = (
    "あなたは越境ECの商品リサーチアシスタントです。"
    "与えられた商品タイプについて、日本・中国市場で流通する代表的な商品候補を列挙します。"
    "ブランド品とノーブランド/OEM品の双方を含めてください。"
    "必ず次の JSON のみを返してください（前後に説明文やコードフェンスを付けない）:\n"
    '{"candidates":[{"name":"商品名","brand":"ブランド名またはOEM","brandType":"brand|oem","model":"型番(任意)","note":"特徴(任意)"}]}\n'
    "実在を断定できない場合でも一般的な候補として構いませんが、価格・在庫・URL は含めないでください。"
)


def _fallback(query: str, limit: int) -> list[ProductCandidate]:
    # カタログ内の一致（サブカテゴリー名を含む）から候補を作る。
    matched = [e for e in PRODUCT_CATALOG if query in e.sub_category or query in e.name]
    candidates: list[ProductCandidate] = []
    for entry in matched[:limit]:
        candidates.append(
            ProductCandidate(
                name=entry.name,
                brand=entry.brand,
                brand_type="oem" if entry.brand == "OEM" else "brand",
                model=entry.model,
                note=entry.sub_category,
            )
        )
    # 不足分はテンプレート候補で補う（ブランド / OEM を 1 件ずつ）。
    if len(candidates) < min(limit, 4):
        candidates.append(
            ProductCandidate(name=f"{query} スタンダードモデル", brand="OEM", brand_type="oem", note="汎用候補")
        )
        candidates.append(
            ProductCandidate(name=f"{query} ブランドモデル", brand="Generic", brand_type="brand", note="汎用候補")
        )
    return candidates[:limit]


def _llm_based(query: str, limit: int) -> list[ProductCandidate]:
    data = llm.complete_json(
        system=_SYSTEM_PROMPT,
        user=f"商品タイプ: {query}\n候補数: {limit}",
    )
    raw = data.get("candidates") or []
    candidates: list[ProductCandidate] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "")).strip()
        if not name:
            continue
        brand_type = str(item.get("brandType") or item.get("brand_type") or "brand").strip().lower()
        if brand_type not in ("brand", "oem"):
            brand_type = "brand"
        candidates.append(
            ProductCandidate(
                name=name,
                brand=str(item.get("brand", "")).strip() or "OEM",
                brand_type=brand_type,
                model=(str(item.get("model")).strip() or None) if item.get("model") else None,
                note=(str(item.get("note")).strip() or None) if item.get("note") else None,
            )
        )
    if not candidates:
        raise ValueError("LLM returned no usable candidates")
    return candidates[:limit]


def discover_products(query: str, limit: int = 8) -> tuple[list[ProductCandidate], str]:
    """商品候補と生成元（"ai" / "rule"）を返す。LLM 優先・失敗時はフォールバック。"""
    query = query.strip()
    limit = max(1, min(limit, 30))
    if not query:
        return [], "rule"

    if llm.is_llm_available():
        try:
            return _llm_based(query, limit), "ai"
        except Exception:
            pass
    return _fallback(query, limit), "rule"
