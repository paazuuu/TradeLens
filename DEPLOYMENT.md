# デプロイ手順（STEP 20 本番環境）

`docs/development_plan.md` セクション 87 の構成に対応する。

```text
Frontend : Vercel（Next.js）
Backend  : Docker（FastAPI）
Database : PostgreSQL
```

## 全体構成

```text
ブラウザ
   │
   ▼
Vercel（Next.js フロント）  ── NEXT_PUBLIC_API_URL ──▶  Backend API（Docker）
                                                          │
                                                          ▼
                                                     PostgreSQL
```

秘密情報（API キー・DB 認証情報・AUTH_SECRET）はフロントに置かず、バックエンド側の
環境変数 / シークレットで管理する（原則: セクション 96）。

## バックエンド（Docker + PostgreSQL）

ローカルまたは VPS/クラウドで一括起動する。

```bash
# ルートで
export AUTH_SECRET="$(openssl rand -hex 32)"   # 本番は必ず設定
# LLM を使う場合のみ:
# export ANTHROPIC_API_KEY="sk-ant-..."
docker compose up --build
```

- API: http://localhost:8000 （ヘルスチェック `/health`、Swagger `/docs`）
- PostgreSQL: localhost:5432（ユーザー/パスワード/DB = crossborder）
- 起動時にテーブル作成と初期シードが自動実行される（`app.main` の lifespan）。

### 主な環境変数（backend）

| 変数 | 説明 | 既定 |
|---|---|---|
| `DATABASE_URL` | 接続文字列（例 `postgresql+psycopg://user:pass@host:5432/db`） | `sqlite:///./dev.db` |
| `CORS_ORIGINS` | 許可オリジン（カンマ区切り） | `http://localhost:3000` |
| `AUTH_SECRET` | JWT 署名鍵（本番必須） | 開発用の既定値 |
| `AUTH_TOKEN_TTL_HOURS` | トークン有効期間 | `72` |
| `ANTHROPIC_API_KEY` | LLM 用（未設定ならルールベース） | 未設定 |
| `ANTHROPIC_MODEL` | 使用モデル | `claude-opus-5` |

単体の Docker イメージとしても動く:

```bash
docker build -t crossborder-api ./backend
docker run -p 8000:8000 -e DATABASE_URL=... -e AUTH_SECRET=... crossborder-api
```

## フロントエンド（Vercel）

1. Vercel で本リポジトリをインポートする（フレームワークは Next.js が自動検出）。
2. 環境変数に `NEXT_PUBLIC_API_URL` を設定する（デプロイ済みバックエンドの URL）。
   - 未設定の場合はモックデータで動作し、認証はデモモードになる。
3. デプロイ後、バックエンド側の `CORS_ORIGINS` に Vercel のドメインを追加する。

ローカル開発:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL を設定
npm install
npm run dev                  # http://localhost:3000
```

## 今後（セクション 87 の残り）

- Scheduler / Worker（Watchlist 定期再調査、STEP 17）
- Monitoring / Logs / Error Tracking
- マイグレーション運用（Alembic 導入。現状は create_all）
