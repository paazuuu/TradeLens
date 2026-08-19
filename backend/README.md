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

## AI 層（STEP 7-8）

Category Agent（カテゴリー分解）と Product Discovery Agent（商品候補生成）を提供する。
LLM（Anthropic）が利用可能ならそれを用い、認証情報が無い / 失敗した場合は
ルールベースへフォールバックする（原則: セクション 93「AI にすべてを任せない」）。
応答の `source` フィールドで生成元（`ai` / `rule`）を明示する（原則: セクション 94）。

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/categories/decompose` | カテゴリー → サブカテゴリー・商品タイプ（STEP 7） |
| POST | `/discovery` | 商品タイプ → 具体的な商品候補（ブランド / OEM 区別、STEP 8） |

LLM を有効化するには Anthropic の認証情報を設定する（未設定ならルールベースで動作）:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export ANTHROPIC_MODEL="claude-opus-5"   # 任意（既定 claude-opus-5）
```

## エンジン層（STEP 10-14）

- **Profit Engine**（`economics.py`, STEP 10-11）: 方向・コストパラメータを引数化。
  コストパラメータは DB の `cost_rules` から注入する（`repository.load_cost_params`）。
- **Opportunity + Direction Engine**（`opportunity_engine.py`, STEP 12-13）:
  各商品について 日本→中国 / 中国→日本 の Opportunity Score を別々に算出し、高い方を
  BEST_DIRECTION とする。スコアはセクション 11 の重み付き要素（利益率・利益額・需要・
  価格差・競合・仕入安定性・季節性・リスク・為替安定性）から決定論的に導く。
- **Seasonal Engine**（`services.py`, STEP 14）: 月・季節ベースのルールでピーク時期と
  推奨仕入れ時期を算定。

スコア・商流方向は DB の生シグナル（価格・競合・需要・リスク等）から計算するため、
`products.score` などの投入値は生の属性、`opportunities` はエンジンの計算結果を保持する。

## データ取り込み（STEP 8 / MVP-02）

外部の商品・価格データを正規化して DB へ取り込む経路。スクレイピングではなく、
正規 API / 許可されたデータ提供手段 / データインポートを前提とする（原則: セクション 9）。

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/ingest/products` | `ProductImport[]` を正規化して upsert（categories/products/market_prices） |

- 中国価格（CNY）は DB の為替レートで円へ正規化し、原価・通貨・取得日時・取得元を保存する（原則: セクション 94）。
- データソースは `app/datasources/`（`DataSource` プロトコル + `MockDataSource`）で差し替え可能。

## 認証（STEP 19）

Email/Password + JWT。パスワードは PBKDF2-HMAC-SHA256（標準ライブラリ）でハッシュ化する。

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/auth/register` | 新規登録（トークンを返す） |
| POST | `/auth/login` | ログイン（トークンを返す） |
| GET | `/auth/me` | 現在のユーザー（`Authorization: Bearer <token>`） |

```bash
export AUTH_SECRET="<本番では必ずランダムな秘密鍵を設定>"
export AUTH_TOKEN_TTL_HOURS=72   # 任意（既定 72）
```

フロントは `src/lib/api/auth.ts` でトークンを localStorage に保持し、ログイン/登録
フォームから呼び出す。`NEXT_PUBLIC_API_URL` 未設定時はデモモードとして
ダッシュボードへ遷移する。

## 今後

- Product Discovery の結果を価格取得層・DB（products / market_prices）へ接続
- 為替 `exchange_rates` の変動から fx_stability を実データ化
- ルート保護（Next.js middleware）とアカウント表示/ログアウトの結線
