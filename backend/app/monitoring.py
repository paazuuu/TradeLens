"""自動監視 + アラート生成（STEP 17-18）。

Watchlist（監視カテゴリー/商品）を再評価し、閾値を超えた商機や季節需要接近を
alerts テーブルへ記録する。同一ユーザー・商品・種別の未読アラートは重複作成しない。
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import opportunity_engine, repository, services
from .models import Alert, Watchlist
from .schemas import Season

ALERT_SCORE = int(os.getenv("ALERT_SCORE", "60"))
SEASON_ALERT_DAYS = int(os.getenv("SEASON_ALERT_DAYS", "60"))


def _has_unread_alert(session: Session, user_id: str | None, product_id: str, kind: str) -> bool:
    existing = session.scalar(
        select(Alert).where(
            Alert.user_id == user_id,
            Alert.product_id == product_id,
            Alert.kind == kind,
            Alert.read_at.is_(None),
        )
    )
    return existing is not None


def run_monitoring(session: Session, now: datetime | None = None) -> dict[str, int]:
    """全ユーザーの Watchlist を再評価し、新規アラートを作成して件数を返す。"""
    now = now or datetime.now(timezone.utc)
    entries = repository.load_catalog(session)
    entries_by_id = {e.id: e for e in entries}
    params = repository.load_cost_params(session)

    watchlists = session.scalars(select(Watchlist)).all()

    # ユーザー別に監視対象の商品 ID を集約する。
    watched: dict[str | None, set[str]] = {}
    watched_categories: dict[str | None, set[str]] = {}
    for w in watchlists:
        if w.kind == "product":
            watched.setdefault(w.user_id, set()).add(w.value)
        elif w.kind == "category":
            watched_categories.setdefault(w.user_id, set()).add(w.value)

    # カテゴリー監視を商品 ID へ展開する。
    for user_id, categories in watched_categories.items():
        for entry in entries:
            if entry.category in categories:
                watched.setdefault(user_id, set()).add(entry.id)

    created = 0
    for user_id, product_ids in watched.items():
        for product_id in product_ids:
            entry = entries_by_id.get(product_id)
            if entry is None:
                continue
            best = opportunity_engine.evaluate(entry, params).best

            # 商機アラート（Score 閾値）。
            if best.score >= ALERT_SCORE and not _has_unread_alert(session, user_id, product_id, "opportunity"):
                session.add(
                    Alert(
                        user_id=user_id,
                        product_id=product_id,
                        kind="opportunity",
                        payload={
                            "score": best.score,
                            "direction": best.direction.value,
                            "estimatedProfit": best.economics.estimated_profit,
                        },
                        message=f"{entry.name}: Score {best.score}",
                        created_at=now,
                    )
                )
                created += 1

            # 季節需要接近アラート。
            if entry.seasonality != Season.ALL_YEAR:
                peak_month = services.SEASON_PEAK_MONTH[entry.seasonality]
                days_to_peak = services._days_until_peak(now, peak_month)
                if days_to_peak <= SEASON_ALERT_DAYS and not _has_unread_alert(
                    session, user_id, product_id, "season"
                ):
                    session.add(
                        Alert(
                            user_id=user_id,
                            product_id=product_id,
                            kind="season",
                            payload={"daysToPeak": days_to_peak, "peakMonth": peak_month},
                            message=f"{entry.name}: ピークまで {days_to_peak}日",
                            created_at=now,
                        )
                    )
                    created += 1

    session.commit()
    return {"watched_users": len(watched), "alerts_created": created}
