"""簡易スケジューラ（STEP 17）。一定間隔で自動監視を実行する。

環境変数 MONITOR_INTERVAL_SECONDS > 0 のときのみ有効（既定 0 = 無効）。
本番では Worker/cron として動かすことを推奨（docker compose の別プロセス等）。
軽量のため threading.Timer を用いる。
"""

from __future__ import annotations

import logging
import os
import threading

from .db import SessionLocal
from .monitoring import run_monitoring

logger = logging.getLogger("crossborder.scheduler")

_timer: threading.Timer | None = None


def _tick(interval: int) -> None:
    try:
        with SessionLocal() as session:
            result = run_monitoring(session)
        logger.info("monitoring tick: %s", result)
    except Exception:  # noqa: BLE001  スケジューラは失敗しても継続する。
        logger.exception("monitoring tick failed")
    finally:
        _schedule(interval)


def _schedule(interval: int) -> None:
    global _timer
    _timer = threading.Timer(interval, _tick, args=(interval,))
    _timer.daemon = True
    _timer.start()


def start_scheduler() -> bool:
    """MONITOR_INTERVAL_SECONDS>0 ならスケジューラを開始する。開始したら True。"""
    interval = int(os.getenv("MONITOR_INTERVAL_SECONDS", "0"))
    if interval <= 0:
        return False
    _schedule(interval)
    logger.info("monitoring scheduler started (interval=%ss)", interval)
    return True


def stop_scheduler() -> None:
    global _timer
    if _timer is not None:
        _timer.cancel()
        _timer = None
