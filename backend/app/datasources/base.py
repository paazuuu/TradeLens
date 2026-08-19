"""データソースの抽象。実装を差し替え可能にする（Protocol）。"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from ..schemas import ProductImport


@runtime_checkable
class DataSource(Protocol):
    """クエリから正規化済みの商品レコードを返すデータソース。"""

    name: str

    def fetch(self, query: str, limit: int = 20) -> list[ProductImport]:
        """クエリ（カテゴリー / 商品タイプ等）に対する商品レコードを返す。"""
        ...
