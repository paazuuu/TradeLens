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
| POST | `/research` | リサーチ実行（同期）。`ResearchOptions` を受け取り、結果を `research_jobs` へ保存して返す |
| GET | `/research/{id}` | 保存済みリサーチ結果の取得 |
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
`market_prices`, `price_history`, `exchange_rates`, `cost_rules`, `profit_calculations`,
`opportunities`, `seasonal_profiles`, `research_jobs`, `watchlists`, `alerts`, `app_settings`。

外部ソース由来のデータには `source` / `source_url` / `retrieved_at` を保持し、
AI 生成値と取得値を区別できるようにしている（原則: セクション 94）。

> テーブル作成は現状 `Base.metadata.create_all`（`init_db`）で行う。スキーマ変更を
> 履歴管理する段階では Alembic マイグレーションへ移行する想定（`今後` 参照）。

## テスト

`pytest` による API・エンジンの回帰テストを備える。各実行は一時 SQLite を用い、
開発/本番 DB とは分離する（`tests/conftest.py`）。

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt   # pytest / httpx を含む
pytest
```

カバー範囲: Opportunity/Profit エンジンの決定論性・スコア境界（`test_engine.py`）、
認証フロー（401/409）・Watchlist 重複排除/削除・リサーチ永続化・マッチング・
取込の CNY→JPY 正規化・Settings 反映（`test_api.py`）。

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

## エンジン層（STEP 9-14）

- **Matching Engine**（`matching_engine.py`, STEP 9）: 日本商品と中国商品を、名前類似度
  （difflib）・型番一致・ブランド一致の複数シグナルでマッチングし、マッチタイプと信頼度を
  算出する（原則: セクション 7）。エンドポイント `POST /matching`。
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

## 自動監視・アラート（STEP 17-18）

Watchlist を再評価し、閾値を超えた商機（Score）や季節需要接近を `alerts` テーブルへ記録する。
同一ユーザー・商品・種別の未読アラートは重複作成しない。

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/monitoring/run` | 全ユーザーの Watchlist を再評価しアラート生成（Worker/cron 用） |
| GET | `/alerts` | 現在ユーザーの保存済みアラート（要認証） |

定期実行は環境変数で有効化する（既定は無効）。本番では Worker/cron を推奨。

```bash
export MONITOR_INTERVAL_SECONDS=3600   # >0 で内蔵スケジューラ有効（既定 0 = 無効）
export ALERT_SCORE=60                  # 商機アラートの Score 閾値
export SEASON_ALERT_DAYS=60            # 季節アラートを出す残り日数
```

## 価格履歴・予測（Phase 2, セクション 41・47）

現在価格（`market_prices`）に加え、月次の価格・需要履歴を `price_history` に保持する。
予測は過去時系列から最小二乗法でトレンドを推定し、季節成分を重ねて先 6 か月を算出する
（AI ではなく決定論的な統計手法。原則: セクション 93）。R² ベースの信頼度を併記する。

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/products/{id}/price-history` | 日中の月次価格・需要履歴（過去 12 か月） |
| GET | `/products/{id}/forecast` | 有望方向の販売市場を対象とした価格・需要予測（先 6 か月） |

実データ蓄積前は、現在値・需要・季節性から決定論的に合成した履歴をシードする
（`history.py`）。生成式はフロント（`src/lib/research/history.ts`）と一致させ、
API 有無に関わらず同一チャートを描く。取込・監視のたびに 1 点追加する運用を想定する。

## 商品分析（Phase 2, セクション 41）

いずれも既存シグナルから決定論的に導出し、フロントの同名モジュールと生成式を一致させる。
FNV-1a 由来の擬似乱数を使う合成値（レビュー・画像）は実行ごとに変化しない。

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/products/{id}/oem-analysis` | OEM 可能性（ブランド有無・マッチ・価格差・供給規模・ブランド信号） |
| GET | `/products/{id}/similar` | 類似・代替候補（サブカテゴリー・名称バイグラム・ブランド・価格帯） |
| GET | `/products/{id}/reviews` | レビュー分析（需要・リスク・件数から観点別センチメントを合成） |
| GET | `/products/{id}/image-comparison` | 画像一致度の推定（画像未取得のためマッチ情報由来） |
| GET | `/analytics/brands` | ブランド・競合分析（平均Score・利益率・利益合計・競合水準・OEM 比率） |
| GET | `/markets/keywords` | 中日市場のキーワード差分析（商品名 n-gram の日中市場強度差） |

`reviews` と `image-comparison` は合成・推定値であることを応答（`sampleSize` / `imagesAvailable=false`）で明示する。実データ接続後は本文集計・画像特徴量比較へ差し替える。

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

- Alembic 導入（`create_all` から履歴管理されたマイグレーションへ移行）
- Product Discovery の結果を価格取得層・DB（products / market_prices）へ接続
- 為替 `exchange_rates` の変動から fx_stability を実データ化
- 実データ接続時: レビュー本文集計・画像特徴量比較・実検索ボリュームでのキーワード分析への差し替え
