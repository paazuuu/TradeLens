"""FastAPI アプリ本体。docs/development_plan.md STEP 5-6 + DB結線（STEP 15 の一部）。

エンドポイント（セクション 72）は DB（products / market_prices）から読み出した
カタログを、決定論的な services / economics 層で集計して返す。
起動時にテーブルを作成し、未投入ならモックデータをシードする。

エンドポイント:
  POST /research            リサーチ実行（同期・Mock）
  GET  /research/{id}       リサーチ結果取得
  GET  /opportunities       有望商品ランキング
  GET  /products/{id}       商品詳細
  POST /profit/simulate     利益シミュレーション
  GET  /markets             日中市場比較
  GET  /seasonal            季節商機
"""

from __future__ import annotations

import os
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import auth, ingest, matching_engine, repository, services
from .agents import category_agent, product_discovery
from .agents.schemas import CategoryTree, DecomposeRequest, DiscoveryRequest, DiscoveryResponse
from .db import SessionLocal, get_session, init_db
from .models import User, Watchlist
from .schemas import (
    IngestResponse,
    LoginRequest,
    MarketsResponse,
    MatchRequest,
    MatchResult,
    Opportunity,
    ProductDetail,
    ProductImport,
    ProfitSimulateRequest,
    ProfitSimulateResponse,
    RegisterRequest,
    ResearchJob,
    ResearchOptions,
    SeasonalOpportunity,
    TokenResponse,
    TradeDirection,
    UserOut,
    WatchlistCreate,
    WatchlistItemOut,
)
from .seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    # テーブル作成。未投入ならモックデータをシードする（開発利便性のため）。
    init_db()
    with SessionLocal() as session:
        if repository.catalog_is_empty(session):
            seed_database(session)
    yield


app = FastAPI(
    title="CrossBorder Opportunity AI API",
    description="日中越境商品リサーチAI のバックエンド（MVP / DB + 決定論エンジン）。",
    version="0.2.0",
    lifespan=lifespan,
)

_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
_allowed_origins = os.getenv("CORS_ORIGINS", _default_origins).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

# リサーチジョブのインメモリ保存（MVP）。実運用では research_jobs テーブルへ移す。
_research_jobs: dict[str, ResearchJob] = {}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# ---- 認証（STEP 19）。Email/Password + JWT。 ----


def _current_user(
    authorization: str | None = Header(default=None), session: Session = Depends(get_session)
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    user_id = auth.decode_token(authorization.split(" ", 1)[1].strip())
    if user_id is None:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="user not found")
    return user


@app.post("/auth/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest, session: Session = Depends(get_session)) -> TokenResponse:
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="invalid email")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="password must be at least 6 characters")
    if session.scalar(select(User).where(User.email == email)) is not None:
        raise HTTPException(status_code=409, detail="email already registered")

    user = User(
        id=f"user-{uuid.uuid4().hex[:12]}",
        email=email,
        display_name=req.display_name,
        password_hash=auth.hash_password(req.password),
    )
    session.add(user)
    session.commit()
    token = auth.create_token(user.id)
    return TokenResponse(access_token=token, user=UserOut(id=user.id, email=user.email, display_name=user.display_name))


@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, session: Session = Depends(get_session)) -> TokenResponse:
    email = req.email.strip().lower()
    user = session.scalar(select(User).where(User.email == email))
    if user is None or not auth.verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid email or password")
    token = auth.create_token(user.id)
    return TokenResponse(access_token=token, user=UserOut(id=user.id, email=user.email, display_name=user.display_name))


@app.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(_current_user)) -> UserOut:
    return UserOut(id=user.id, email=user.email, display_name=user.display_name)


# ---- Watchlists（STEP 16）。認証ユーザーに紐づく監視カテゴリー/商品。 ----


def _to_watchlist_out(item: Watchlist) -> WatchlistItemOut:
    return WatchlistItemOut(id=item.id, kind=item.kind, value=item.value, monitor_frequency=item.monitor_frequency)


@app.get("/watchlists", response_model=list[WatchlistItemOut])
def list_watchlists(
    user: User = Depends(_current_user), session: Session = Depends(get_session)
) -> list[WatchlistItemOut]:
    items = session.scalars(select(Watchlist).where(Watchlist.user_id == user.id).order_by(Watchlist.id)).all()
    return [_to_watchlist_out(item) for item in items]


@app.post("/watchlists", response_model=WatchlistItemOut, status_code=201)
def add_watchlist(
    req: WatchlistCreate, user: User = Depends(_current_user), session: Session = Depends(get_session)
) -> WatchlistItemOut:
    if req.kind not in ("category", "product"):
        raise HTTPException(status_code=400, detail="kind must be 'category' or 'product'")
    existing = session.scalar(
        select(Watchlist).where(
            Watchlist.user_id == user.id, Watchlist.kind == req.kind, Watchlist.value == req.value
        )
    )
    if existing is not None:
        return _to_watchlist_out(existing)
    item = Watchlist(user_id=user.id, kind=req.kind, value=req.value, monitor_frequency=req.monitor_frequency)
    session.add(item)
    session.commit()
    return _to_watchlist_out(item)


@app.delete("/watchlists/{item_id}", status_code=204)
def delete_watchlist(
    item_id: int, user: User = Depends(_current_user), session: Session = Depends(get_session)
) -> Response:
    item = session.get(Watchlist, item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="watchlist item not found")
    session.delete(item)
    session.commit()
    return Response(status_code=204)


@app.post("/research", response_model=ResearchJob)
def create_research(options: ResearchOptions, session: Session = Depends(get_session)) -> ResearchJob:
    entries = repository.load_catalog(session)
    params = repository.load_cost_params(session)
    result = services.compute_research_result(options, entries=entries, params=params)
    job = ResearchJob(id=f"job-{uuid.uuid4().hex[:12]}", status="completed", options=options, result=result)
    _research_jobs[job.id] = job
    return job


@app.get("/research/{job_id}", response_model=ResearchJob)
def get_research(job_id: str) -> ResearchJob:
    job = _research_jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="research job not found")
    return job


@app.get("/opportunities", response_model=list[Opportunity])
def get_opportunities(
    direction: TradeDirection | None = Query(default=None),
    min_score: int | None = Query(default=None, ge=0, le=100),
    min_margin: float | None = Query(default=None, ge=0),
    session: Session = Depends(get_session),
) -> list[Opportunity]:
    entries = repository.load_catalog(session)
    params = repository.load_cost_params(session)
    return services.list_opportunities(
        direction=direction, min_score=min_score, min_margin=min_margin, entries=entries, params=params
    )


@app.get("/products/{product_id}", response_model=ProductDetail)
def get_product(product_id: str, session: Session = Depends(get_session)) -> ProductDetail:
    entries = repository.load_catalog(session)
    params = repository.load_cost_params(session)
    detail = services.get_product_detail(product_id, entries=entries, params=params)
    if detail is None:
        raise HTTPException(status_code=404, detail="product not found")
    return detail


@app.post("/profit/simulate", response_model=ProfitSimulateResponse)
def post_profit_simulate(req: ProfitSimulateRequest) -> ProfitSimulateResponse:
    return services.simulate_profit(req)


@app.get("/markets", response_model=MarketsResponse)
def get_markets(session: Session = Depends(get_session)) -> MarketsResponse:
    entries = repository.load_catalog(session)
    params = repository.load_cost_params(session)
    return MarketsResponse(
        overview=services.get_market_overview(entries=entries),
        comparison=services.get_market_comparison(entries=entries, params=params),
    )


@app.get("/seasonal", response_model=list[SeasonalOpportunity])
def get_seasonal(session: Session = Depends(get_session)) -> list[SeasonalOpportunity]:
    entries = repository.load_catalog(session)
    params = repository.load_cost_params(session)
    return services.get_seasonal_opportunities(entries=entries, params=params)


# ---- AI 層（STEP 7-8）。LLM 優先・失敗時はルールベースにフォールバック。 ----


@app.post("/categories/decompose", response_model=CategoryTree)
def post_decompose(req: DecomposeRequest) -> CategoryTree:
    return category_agent.decompose_category(req.category)


@app.post("/discovery", response_model=DiscoveryResponse)
def post_discovery(req: DiscoveryRequest) -> DiscoveryResponse:
    candidates, source = product_discovery.discover_products(req.query, req.limit)
    return DiscoveryResponse(query=req.query, candidates=candidates, source=source)


# ---- データ取り込み（STEP 8 / MVP-02）。正規化して DB へ upsert する。 ----


@app.post("/ingest/products", response_model=IngestResponse)
def ingest_products(items: list[ProductImport], session: Session = Depends(get_session)) -> IngestResponse:
    return ingest.import_products(session, items)


# ---- 商品マッチング（STEP 9）。日中商品を複数シグナルでマッチングする。 ----


@app.post("/matching", response_model=MatchResult)
def post_matching(req: MatchRequest) -> MatchResult:
    return matching_engine.match_products(req)
