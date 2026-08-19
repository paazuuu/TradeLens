"""Category Agent（STEP 7）。カテゴリーをサブカテゴリー・商品タイプへ分解する。

LLM が使えれば LLM で分解し、使えなければルールベースの静的マップへフォールバックする。
既知カテゴリー（キャンプ用品）は docs/development_plan.md セクション 5 の階層に対応。
"""

from __future__ import annotations

from ..catalog import PRODUCT_CATALOG
from . import llm
from .schemas import CategoryTree, SubCategory

# ルールベースの分解表（既知カテゴリー）。セクション 5 のツリーに対応。
_RULE_TREES: dict[str, list[SubCategory]] = {
    "キャンプ用品": [
        SubCategory(name="テント", product_types=["ソロテント", "2人用テント", "ファミリーテント", "ワンタッチテント"]),
        SubCategory(name="調理器具", product_types=["クッカー", "バーナー", "ケトル", "ホットサンドメーカー"]),
        SubCategory(name="椅子・テーブル", product_types=["ローチェア", "折りたたみチェア", "キャンプテーブル"]),
        SubCategory(name="ランタン", product_types=["LEDランタン", "USBランタン", "ガスランタン"]),
        SubCategory(name="寝具", product_types=["シュラフ", "マット", "枕"]),
    ],
}

_SYSTEM_PROMPT = (
    "あなたは越境ECの商品カテゴリー分解アシスタントです。"
    "与えられた大カテゴリーを、日本・中国市場で流通する具体的なサブカテゴリーと商品タイプへ分解します。"
    "必ず次の JSON のみを返してください（前後に説明文やコードフェンスを付けない）:\n"
    '{"subCategories":[{"name":"サブカテゴリー名","productTypes":["商品タイプ1","商品タイプ2"]}]}\n'
    "サブカテゴリーは 4〜8 個、各サブカテゴリーの商品タイプは 3〜6 個とし、合計 15〜40 個程度にしてください。"
)


def _rule_based(category: str) -> CategoryTree:
    sub_categories = _RULE_TREES.get(category)
    if sub_categories is None:
        # 未知カテゴリー: カタログ内の一致サブカテゴリーから推定、無ければ汎用 1 段。
        matched = sorted({e.sub_category for e in PRODUCT_CATALOG if e.category == category})
        if matched:
            sub_categories = [SubCategory(name=category, product_types=matched)]
        else:
            sub_categories = [SubCategory(name=category, product_types=[f"{category} 一般"])]
    return CategoryTree(category=category, sub_categories=sub_categories, source="rule")


def _llm_based(category: str) -> CategoryTree:
    data = llm.complete_json(
        system=_SYSTEM_PROMPT,
        user=f"大カテゴリー: {category}",
    )
    raw_subs = data.get("subCategories") or data.get("sub_categories") or []
    sub_categories = [
        SubCategory(
            name=str(sub.get("name", "")).strip() or category,
            product_types=[str(pt).strip() for pt in (sub.get("productTypes") or sub.get("product_types") or []) if str(pt).strip()],
        )
        for sub in raw_subs
        if isinstance(sub, dict)
    ]
    sub_categories = [s for s in sub_categories if s.product_types]
    if not sub_categories:
        raise ValueError("LLM returned no usable subcategories")
    return CategoryTree(category=category, sub_categories=sub_categories, source="ai")


def decompose_category(category: str) -> CategoryTree:
    """カテゴリーを分解する。LLM 優先・失敗時はルールベース。"""
    category = category.strip()
    if not category:
        return CategoryTree(category=category, sub_categories=[], source="rule")

    if llm.is_llm_available():
        try:
            return _llm_based(category)
        except Exception:
            # 認証・ネットワーク・パース失敗などはルールベースへフォールバック。
            pass
    return _rule_based(category)
