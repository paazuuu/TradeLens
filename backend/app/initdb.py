"""DB 初期化 CLI: テーブル作成 + モックデータ投入。

    python -m app.initdb          # 作成 + シード
    python -m app.initdb --schema-only   # 作成のみ（投入しない）
"""

from __future__ import annotations

import sys

from .db import SessionLocal, init_db
from .seed import seed_database


def main() -> None:
    schema_only = "--schema-only" in sys.argv

    init_db()
    print("tables created.")

    if schema_only:
        return

    with SessionLocal() as session:
        counts = seed_database(session)
    print("seeded:", ", ".join(f"{k}={v}" for k, v in counts.items()))


if __name__ == "__main__":
    main()
