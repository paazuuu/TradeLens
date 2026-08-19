"""AI エージェントの入出力スキーマ（STEP 7-8）。"""

from __future__ import annotations

from ..schemas import CamelModel


class SubCategory(CamelModel):
    name: str
    product_types: list[str]


class CategoryTree(CamelModel):
    category: str
    sub_categories: list[SubCategory]
    # 生成元を明示する（"ai" = LLM 生成 / "rule" = ルールベース）。原則: セクション 94。
    source: str


class DecomposeRequest(CamelModel):
    category: str


class ProductCandidate(CamelModel):
    name: str
    brand: str
    # "brand"（ブランド品）/ "oem"（ノーブランド・OEM）を区別する（セクション 6）。
    brand_type: str
    model: str | None = None
    note: str | None = None


class DiscoveryRequest(CamelModel):
    query: str
    limit: int = 8


class DiscoveryResponse(CamelModel):
    query: str
    candidates: list[ProductCandidate]
    source: str
