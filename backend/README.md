# CrossBorder Opportunity AI — Backend

日中越境商品リサーチAI のバックエンド API（FastAPI）。
`docs/development_plan.md` の **STEP 5（Backend基盤）** に対応する。

MVP 段階では PostgreSQL 接続前として、決定論的なルールエンジン（Profit Engine）と
モック商品カタログでフロントエンドと同じ計算結果を提供する（設計原則: セクション 93）。
数値の算定はすべてコード側で確定させ、AI には委ねない。

## セットアップ

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 起動

```bash
uvicorn app.main:app --reload --port 8000
```

- API ドキュメント（Swagger UI）: http://localhost:8000/docs
- ヘルスチェック: http://localhost:8000/health

フロントエンド（Next.js, :3000）からの CORS を既定で許可する。
別オリジンを許可する場合は環境変数 `CORS_ORIGINS`（カンマ区切り）を設定する。

## エンドポイント（セクション 72）

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/research` | リサーチ実行（同期・Mock）。`ResearchOptions` を受け取りジョブと結果を返す |
| GET | `/research/{id}` | リサーチ結果の取得 |
| GET | `/opportunities` | 有望商品ランキング（`direction` / `minScore` / `minMargin` で絞り込み可） |
| GET | `/products/{id}` | 商品詳細（日中市場・利益内訳・AI 有望理由・信頼度） |
| POST | `/profit/simulate` | 利益シミュレーション（総コストベース） |
| GET | `/markets` | 日中市場比較（KPI とサブカテゴリー別集計） |
| GET | `/seasonal` | 季節商機（ピーク時期・推奨仕入れ時期） |

レスポンスは camelCase で返し、フロントの `src/lib/research/types.ts` と対応する。

## フロントエンドとの結線

フロント（Next.js）は環境変数 `NEXT_PUBLIC_API_URL` が設定されていれば本 API から
データを取得し、未設定・到達不能時はモックデータへフォールバックする
（`src/lib/research/data-source.ts`）。そのためバックエンド未起動でもフロントは単体で動く。

```bash
# フロントのルートに .env.local を作成
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local

# バックエンド起動 → フロント起動
cd backend && uvicorn app.main:app --reload --port 8000
npm run dev   # 別ターミナル
```

結線済みの画面: Dashboard 以外の主要読み取り画面（Opportunities / Products /
Product Detail / Markets / Seasonal）と AI Research（POST /research）。

## データベース（STEP 6）

PostgreSQL を既定とし、`DATABASE_URL` 未設定時はローカル開発用に SQLite へフォールバックする。
モデルは方言非依存の型で定義しているため、両方で動作する（セクション 73）。

```bash
# PostgreSQL を使う場合（例）
export DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/crossborder"

# テーブル作成 + モックデータ投入
python -m app.initdb

# テーブル作成のみ
python -m app.initdb --schema-only

# 参照用の PostgreSQL DDL を backend/schema.sql に生成
python scripts/dump_schema.py
```

初期テーブル（セクション 73）: `users`, `categories`, `products`, `product_matches`,
`market_prices`, `exchange_rates`, `cost_rules`, `profit_calculations`, `opportunities`,
`seasonal_profiles`, `research_jobs`, `watchlists`, `alerts`。

外部ソース由来のデータには `source` / `source_url` / `retrieved_at` を保持し、
AI 生成値と取得値を区別できるようにしている（原則: セクション 94）。

## 構成

```text
backend/
├── app/
│   ├── main.py       # FastAPI アプリ・ルーティング・CORS
│   ├── schemas.py    # Pydantic モデル（TS の types.ts に対応）
│   ├── catalog.py    # モック商品カタログ（mock-data.ts に対応）
│   ├── economics.py  # Profit Engine（economics.ts に対応）
│   ├── services.py   # 集計・導出ロジック（markets/seasonal/research）
│   ├── db.py         # DB 接続・セッション（SQLAlchemy）
│   ├── models.py     # ORM モデル（セクション 73）
│   ├── seed.py       # モックデータ投入
│   └── initdb.py     # 初期化 CLI
├── scripts/dump_schema.py  # PostgreSQL DDL 生成
└── schema.sql        # 生成された参照用 DDL
```

## 今後（STEP 7 以降）

- STEP 7-8: Category Agent / Product Discovery（AI 層）
- STEP 9-14: Matching / Pricing / Profit / Opportunity / Direction / Seasonal Engine の実データ化
- STEP 15: フロントの `src/lib/research/*` を本 API 呼び出しへ差し替え（API を DB バックエンドへ）
