"""参照用 HTTP データソース・アダプタ（Phase 3 / 実データ接続の雛形）。

正規 API / 許可されたデータ提供エンドポイント（JSON）から商品・価格を取得し、
`ProductImport` へ正規化する DataSource 実装の雛形。実際の接続では `_map_record` を
対象 API のレスポンス形状に合わせて書き換えるだけでよい（下流のエンジン・API・
フロントは無改修）。

設定は環境変数で行い、未設定なら空リストを返して安全に無効化する:
  DATA_SOURCE_URL      取得先エンドポイント（未設定なら無効）
  DATA_SOURCE_API_KEY  任意。設定時は Authorization: Bearer <key> を付与
  DATA_SOURCE_NAME     任意。取得元表示名（既定 "http"）

スクレイピングではなく、利用規約・API 条件に従った正規取得を前提とする
（原則: セクション 9）。本番では httpx / 各社 SDK の採用を推奨する。
"""

from __future__ import annotations

import logging
import os

from ..schemas import MarketPriceInput, MatchType, ProductImport, RiskLevel, Season, SizeTier

logger = logging.getLogger("crossborder.datasource.http")

# 列挙の安全な変換（不明値は既定へフォールバック）。
_SIZE = {"S": SizeTier.S, "M": SizeTier.M, "L": SizeTier.L}
_SEASON = {s.value: s for s in Season}
_RISK = {r.value: r for r in RiskLevel}
_MATCH = {m.value: m for m in MatchType}


class HttpDataSource:
    """設定された HTTP エンドポイントから商品を取得するアダプタ。"""

    def __init__(self) -> None:
        self.url = os.getenv("DATA_SOURCE_URL", "").strip()
        self.api_key = os.getenv("DATA_SOURCE_API_KEY", "").strip()
        self.name = os.getenv("DATA_SOURCE_NAME", "http").strip() or "http"

    @property
    def configured(self) -> bool:
        return bool(self.url)

    def fetch(self, query: str, limit: int = 20) -> list[ProductImport]:
        if not self.configured:
            logger.info("HttpDataSource is not configured (DATA_SOURCE_URL unset); returning no records")
            return []
        try:
            import httpx  # 遅延 import。未導入環境でもモジュール読み込みは失敗させない。
        except ImportError:
            logger.warning("httpx is not installed; cannot fetch from %s", self.url)
            return []

        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        try:
            response = httpx.get(self.url, params={"q": query, "limit": limit}, headers=headers, timeout=15.0)
            response.raise_for_status()
            payload = response.json()
        except Exception:  # noqa: BLE001  取得失敗は空で返し、呼び出し側の取り込みを止めない。
            logger.exception("fetch failed from %s", self.url)
            return []

        records = payload.get("items", payload) if isinstance(payload, dict) else payload
        if not isinstance(records, list):
            logger.warning("unexpected payload shape from %s", self.url)
            return []

        items: list[ProductImport] = []
        for raw in records[:limit]:
            try:
                mapped = self._map_record(raw)
            except Exception:  # noqa: BLE001  不正な 1 件で全体を止めず、その行だけ読み飛ばす。
                logger.exception("failed to map record; skipping: %r", raw)
                continue
            if mapped is not None:
                items.append(mapped)
        return items

    def _map_record(self, raw: dict) -> ProductImport | None:
        """外部 JSON 1 件を ProductImport へ変換する（← ここを対象 API に合わせて実装）。

        雛形は次の JSON 形状を想定する。対象 API の実際のキーへ読み替えて使う:
          {
            "id": "sku-123", "name": "...", "brand": "...",
            "category": "...", "subCategory": "...", "model": "...",
            "sizeTier": "M", "seasonality": "AllYear", "risk": "Medium",
            "matchType": "SIMILAR", "matchConfidence": 70, "imageUrl": null,
            "japan": {"price": 4980, "currency": "JPY", "competitors": 30,
                      "demandIndex": 70, "reviewCount": 500, "sourceUrl": "..."},
            "china": {"price": 90, "currency": "CNY", ...}
          }
        価格の通貨は保持したまま返す（CNY→JPY 正規化は ingest 側が為替で行う）。
        必須項目（id / name / japan / china）を欠くレコードは None を返して読み飛ばす。
        """
        try:
            product_id = str(raw["id"])
            name = str(raw["name"])
            jp_raw = raw["japan"]
            cn_raw = raw["china"]
        except (KeyError, TypeError):
            logger.warning("skipping record without required fields: %r", raw)
            return None

        return ProductImport(
            id=product_id,
            name=name,
            brand=str(raw.get("brand", "")),
            category=str(raw.get("category", "")),
            sub_category=str(raw.get("subCategory", raw.get("sub_category", ""))),
            model=str(raw.get("model", "")),
            size_tier=_SIZE.get(str(raw.get("sizeTier", "M")), SizeTier.M),
            seasonality=_SEASON.get(str(raw.get("seasonality", "AllYear")), Season.ALL_YEAR),
            risk=_RISK.get(str(raw.get("risk", "Medium")), RiskLevel.MEDIUM),
            match_type=_MATCH.get(str(raw.get("matchType", "SIMILAR")), MatchType.SIMILAR),
            match_confidence=raw.get("matchConfidence"),
            image_url=raw.get("imageUrl"),
            japan=self._map_market(jp_raw, "JP"),
            china=self._map_market(cn_raw, "CN"),
        )

    def _map_market(self, raw: dict, market: str) -> MarketPriceInput:
        return MarketPriceInput(
            market=market,
            price=float(raw["price"]),
            currency=str(raw.get("currency", "JPY")),
            competitors=raw.get("competitors"),
            demand_index=raw.get("demandIndex", raw.get("demand_index")),
            review_count=raw.get("reviewCount", raw.get("review_count")),
            source=self.name,
            source_url=raw.get("sourceUrl", raw.get("source_url")),
        )
