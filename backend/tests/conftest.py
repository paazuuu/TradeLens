"""pytest 共通フィクスチャ。

各テストセッションは一時 SQLite ファイルを用い、本番/開発 DB とは分離する。
DATABASE_URL はアプリ import 前に設定する必要があるため、このモジュール冒頭で行う。
"""

from __future__ import annotations

import os
import tempfile
from collections.abc import Iterator

# アプリ（app.db）を import する前に一時 DB を指すよう環境変数を設定する。
_TMP_DB = os.path.join(tempfile.mkdtemp(prefix="tradelens-test-"), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DB}"
os.environ.setdefault("AUTH_SECRET", "test-secret")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    """lifespan（init_db + seed）を起動した TestClient を返す。"""
    with TestClient(app) as test_client:
        yield test_client
