"""データベース接続とセッション（SQLAlchemy 2.0）。

docs/development_plan.md STEP 6（Database）。既定は PostgreSQL（本番）。
DATABASE_URL 未設定時はローカル開発用に SQLite へフォールバックする。
モデルは方言非依存の型で定義し、PostgreSQL / SQLite の双方で動作する。
"""

from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# 例: postgresql+psycopg://user:pass@localhost:5432/crossborder
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, future=True, connect_args=_connect_args)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """全 ORM モデルの基底。"""


def get_session():
    """FastAPI 依存性注入用のセッションジェネレータ。"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db() -> None:
    """全テーブルを作成する（MVP。将来的には Alembic マイグレーションへ移行）。"""
    from . import models  # noqa: F401  モデル登録のため

    Base.metadata.create_all(bind=engine)
