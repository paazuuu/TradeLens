"""データ取得層（STEP 8 / MVP-02、実データ接続の差し替え口）。

外部の商品・価格データを正規化済みの ProductImport として取り込む経路を提供する。
スクレイピングではなく、正規 API / 許可されたデータ提供手段 / データインポートを前提とする
（原則: セクション 9「データ取得元の利用規約・API 条件を遵守する」）。

`DataSource` プロトコルを満たすアダプタを登録し、名前で取得して取り込みを回す。
新しいデータ源は http_source.py を参考に 1 ファイル追加し、_SOURCE_FACTORIES に登録するだけでよい。
"""

from __future__ import annotations

from collections.abc import Callable

from sqlalchemy.orm import Session

from .base import DataSource
from .http_source import HttpDataSource
from .mock_source import MockDataSource

# 名前 → アダプタ生成関数。実 API アダプタを増やす場合はここへ登録する。
_SOURCE_FACTORIES: dict[str, Callable[[], DataSource]] = {
    "mock": MockDataSource,
    "http": HttpDataSource,
}


def available_sources() -> list[str]:
    """登録済みデータ源の名前一覧。"""
    return sorted(_SOURCE_FACTORIES)


def get_source(name: str) -> DataSource:
    """名前からデータ源アダプタを生成する。未登録なら KeyError。"""
    factory = _SOURCE_FACTORIES.get(name)
    if factory is None:
        raise KeyError(name)
    return factory()


def run_ingestion(session: Session, source_name: str, query: str, limit: int = 20):
    """指定データ源から取得し、DB へ取り込む。IngestResponse を返す。

    source.fetch()（正規化済み ProductImport）→ import_products（upsert + 価格履歴追記）
    の 1 パス。定期実行は scheduler / cron から本関数を呼ぶ。
    """
    from ..ingest import import_products  # 遅延 import（循環回避）。

    source = get_source(source_name)
    items = source.fetch(query, limit=limit)
    return import_products(session, items, source=source_name)
