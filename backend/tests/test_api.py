"""API 統合テスト（TestClient）。認証・監視・リサーチ永続化・取込・マッチングを検証する。"""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def _auth_headers(client: TestClient, email: str | None = None) -> dict[str, str]:
    email = email or f"user-{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/auth/register", json={"email": email, "password": "secret123", "displayName": "Tester"})
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['accessToken']}"}


def test_health(client: TestClient) -> None:
    assert client.get("/health").status_code == 200


def test_opportunities_scores_sorted_desc(client: TestClient) -> None:
    res = client.get("/opportunities")
    assert res.status_code == 200
    scores = [o["score"] for o in res.json()]
    assert scores == sorted(scores, reverse=True)


def test_auth_flow_and_errors(client: TestClient) -> None:
    email = f"auth-{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/auth/register", json={"email": email, "password": "secret123"})
    assert reg.status_code == 201
    # 重複メールは 409。
    dup = client.post("/auth/register", json={"email": email, "password": "secret123"})
    assert dup.status_code == 409
    # 誤パスワードは 401。
    bad = client.post("/auth/login", json={"email": email, "password": "wrong"})
    assert bad.status_code == 401
    # トークン無しの保護 API は 401。
    assert client.get("/auth/me").status_code == 401
    token = reg.json()["accessToken"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["email"] == email


def test_watchlist_dedup_and_delete(client: TestClient) -> None:
    headers = _auth_headers(client)
    body = {"kind": "category", "value": "キャンプ用品", "monitorFrequency": "weekly"}
    first = client.post("/watchlists", json=body, headers=headers)
    second = client.post("/watchlists", json=body, headers=headers)
    assert first.status_code == 201
    # 重複追加は同一項目を返す（新規作成しない）。
    assert second.json()["id"] == first.json()["id"]
    item_id = first.json()["id"]
    deleted = client.delete(f"/watchlists/{item_id}", headers=headers)
    assert deleted.status_code == 204
    # 削除後は 404。
    assert client.delete(f"/watchlists/{item_id}", headers=headers).status_code == 404


def test_research_persisted_and_retrievable(client: TestClient) -> None:
    res = client.post("/research", json={"category": "キャンプ用品", "direction": "BOTH", "minScore": 40})
    assert res.status_code == 200
    job = res.json()
    fetched = client.get(f"/research/{job['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["result"] == job["result"]
    assert client.get("/research/job-does-not-exist").status_code == 404


def test_matching_exact_vs_unmatched(client: TestClient) -> None:
    exact = client.post(
        "/matching",
        json={"japanName": "折りたたみLEDランタン", "chinaName": "折りたたみLEDランタン"},
    )
    assert exact.status_code == 200
    assert exact.json()["matchType"] == "EXACT"

    # 型番一致は名前一致より高い信頼度になる（複数シグナルの加点）。
    with_model = client.post(
        "/matching",
        json={
            "japanName": "折りたたみLEDランタン",
            "chinaName": "折りたたみLEDランタン",
            "japanModel": "LN-220C",
            "chinaModel": "LN-220C",
        },
    )
    assert with_model.json()["confidence"] > exact.json()["confidence"]

    unmatched = client.post("/matching", json={"japanName": "テント", "chinaName": "包丁セット"})
    assert unmatched.json()["matchType"] == "UNMATCHED"
    assert unmatched.json()["confidence"] < exact.json()["confidence"]


def test_ingest_normalizes_cny_to_jpy(client: TestClient) -> None:
    pid = f"test-{uuid.uuid4().hex[:8]}"
    item = {
        "id": pid,
        "name": "テスト商品",
        "brand": "OEM",
        "category": "キャンプ用品",
        "subCategory": "テスト",
        "japan": {"market": "JP", "price": 5000, "currency": "JPY"},
        "china": {"market": "CN", "price": 90, "currency": "CNY"},
    }
    res = client.post("/ingest/products", json=[item])
    assert res.status_code == 200
    detail = client.get(f"/products/{pid}")
    assert detail.status_code == 200
    # 為替換算後の中国価格は元建て 90 を大きく上回る（JPY 正規化）。
    assert detail.json()["china"]["price"] > 90


def test_price_history_anchored_to_current(client: TestClient) -> None:
    hist = client.get("/products/opp-001/price-history")
    assert hist.status_code == 200
    body = hist.json()
    assert len(body["japan"]) == 12 and len(body["china"]) == 12
    detail = client.get("/products/opp-001").json()
    # 履歴の最新点は現在の市場価格に一致する。
    assert body["japan"][-1]["price"] == detail["japan"]["price"]
    assert client.get("/products/nope/price-history").status_code == 404


def test_forecast_targets_sell_market(client: TestClient) -> None:
    res = client.get("/products/opp-001/forecast")
    assert res.status_code == 200
    fc = res.json()
    # opp-001 は中国→日本が有望＝販売市場は日本。
    assert fc["bestDirection"] == "CN_TO_JP"
    assert fc["market"] == "JP"
    assert len(fc["priceForecast"]["points"]) == 6
    assert len(fc["demandForecast"]["points"]) == 6
    assert all(0 <= p["value"] <= 100 for p in fc["demandForecast"]["points"])


def test_oem_analysis_distinguishes_brands(client: TestClient) -> None:
    # opp-001 は OEM ブランド・OEM_CANDIDATE で可能性が高い。
    oem = client.get("/products/opp-001/oem-analysis")
    assert oem.status_code == 200
    body = oem.json()
    assert body["verdict"] == "likely"
    assert "noBrand" in body["signals"]
    # opp-005 は実ブランド・EXACT で可能性が低い。
    branded = client.get("/products/opp-005/oem-analysis").json()
    assert branded["verdict"] == "unlikely"
    assert branded["score"] < body["score"]
    assert client.get("/products/nope/oem-analysis").status_code == 404


def test_similar_products_ranked_and_bounded(client: TestClient) -> None:
    res = client.get("/products/opp-001/similar?limit=4")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 4
    # 自身は含まれない。
    assert all(item["id"] != "opp-001" for item in items)
    # 類似度降順。
    sims = [item["similarity"] for item in items]
    assert sims == sorted(sims, reverse=True)
    assert all(0 <= item["similarity"] <= 100 for item in items)
    assert client.get("/products/nope/similar").status_code == 404


def test_settings_roundtrip_changes_profit(client: TestClient) -> None:
    headers = _auth_headers(client)
    before = client.get("/products/opp-001").json()["economics"]["estimatedProfit"]
    put = client.put(
        "/settings",
        json={
            "exchangeRate": 21.0,
            "intlShipping": 6000,
            "domesticShipping": 3000,
            "importTaxRate": 20.0,
            "platformFeeRate": 25.0,
            "minMargin": 20.0,
            "minScore": 60,
        },
        headers=headers,
    )
    assert put.status_code == 200
    after = client.get("/products/opp-001").json()["economics"]["estimatedProfit"]
    # コストを引き上げたので利益は減少する。
    assert after < before
