"""ORM モデルから PostgreSQL の DDL を生成し backend/schema.sql に書き出す。

    python scripts/dump_schema.py

参照用の DDL。実際のテーブル作成は `python -m app.initdb`（create_all）で行う。
"""

from __future__ import annotations

import sys
from pathlib import Path

# backend ルートを import パスに追加し、どこから実行しても app を解決できるようにする。
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable, MetaData

from app.db import Base
from app import models  # noqa: F401  モデル登録のため


def main() -> None:
    metadata: MetaData = Base.metadata
    dialect = postgresql.dialect()

    lines = ["-- 自動生成: python scripts/dump_schema.py（編集しない）", "-- docs/development_plan.md セクション 73", ""]
    for table in metadata.sorted_tables:
        ddl = str(CreateTable(table).compile(dialect=dialect)).strip()
        lines.append(f"{ddl};")
        lines.append("")

    output = Path(__file__).resolve().parent.parent / "schema.sql"
    output.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {output} ({len(metadata.sorted_tables)} tables)")


if __name__ == "__main__":
    main()
