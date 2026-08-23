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
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import (
    auth,
    brands,
    images,
    ingest,
    insights,
    keywords,
    matching_engine,
    monitoring,
    oem,
    opportunity_engine,
    repository,
    reviews,
    scheduler,
    services,
    similar,
    timeseries,
)
from .agents import category_agent, product_discovery
from .agents.schemas import CategoryTree, DecomposeRequest, DiscoveryRequest, DiscoveryResponse
from .db import SessionLocal, get_session, init_db
from .models import Alert, AppSetting, User, Watchlist
from .schemas import (
    AlertOut,
    AnalyticsResponse,
    BrandStat,
    DashboardResponse,
    ImageComparison,
    IngestResponse,
    KeywordGap,
    SettingsOut,
    LoginRequest,
    MarketsResponse,
    MatchRequest,
    MatchResult,
    MonitoringResult,
    OemAnalysis,
    Opportunity,
    PriceHistoryResponse,
    ProductDetail,
    ProductForecastResponse,
    ProductImport,
    ProfitSimulateRequest,
    ProfitSimulateResponse,
    RegisterRequest,
    ResearchJob,
    ResearchOptions,
    ReviewAnalysis,
    SeasonalOpportunity,
    SimilarProduct,
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
    # 自動監視スケジューラ（MONITOR_INTERVAL_SECONDS>0 のときのみ）。
    scheduler.start_scheduler()
    try:
        yield
    finally:
        scheduler.stop_scheduler()


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


def _optional_user(
    authorization: str | None = Header(default=None), session: Session = Depends(get_session)
) -> User | None:
    """トークンがあればユーザーを返し、無ければ None（デモ・匿名実行を許可）。"""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    user_id = auth.decode_token(authorization.split(" ", 1)[1].strip())
    if user_id is None:
        return None
    return session.get(User, user_id)


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


# ---- 自動監視・アラート（STEP 17-18）。 ----


@app.post("/monitoring/run", response_model=MonitoringResult)
def monitoring_run(session: Session = Depends(get_session)) -> MonitoringResult:
    # Worker/cron から呼ぶ想定。全ユーザーの Watchlist を再評価しアラートを生成する。
    result = monitoring.run_monitoring(session)
    return MonitoringResult(watched_users=result["watched_users"], alerts_created=result["alerts_created"])


_DEFAULT_SETTINGS = SettingsOut(
    exchange_rate=21.0,
    intl_shipping=1600,
    domestic_shipping=700,
    import_tax_rate=5.0,
    platform_fee_rate=10.0,
    min_margin=20.0,
    min_score=70,
)


@app.get("/settings", response_model=SettingsOut)
def get_settings(session: Session = Depends(get_session)) -> SettingsOut:
    setting = session.get(AppSetting, 1)
    if setting is None:
        return _DEFAULT_SETTINGS
    return SettingsOut(
        exchange_rate=setting.exchange_rate,
        intl_shipping=setting.intl_shipping,
        domestic_shipping=setting.domestic_shipping,
        import_tax_rate=setting.import_tax_rate,
        platform_fee_rate=setting.platform_fee_rate,
        min_margin=setting.min_margin,
        min_score=setting.min_score,
    )


@app.put("/settings", response_model=SettingsOut)
def update_settings(
    req: SettingsOut, _user: User = Depends(_current_user), session: Session = Depends(get_session)
) -> SettingsOut:
    setting = session.get(AppSetting, 1)
    if setting is None:
        setting = AppSetting(id=1)
        session.add(setting)
    setting.exchange_rate = req.exchange_rate
    setting.intl_shipping = req.intl_shipping
    setting.domestic_shipping = req.domestic_shipping
    setting.import_tax_rate = req.import_tax_rate
    setting.platform_fee_rate = req.platform_fee_rate
    setting.min_margin = req.min_margin
    setting.min_score = req.min_score
    # 為替は exchange_rates にも反映し、取り込み時の正規化に使う。
    from .models import ExchangeRate

    session.add(
        ExchangeRate(base_currency="CNY", quote_currency="JPY", rate=req.exchange_rate, kind="current")
    )
    session.commit()
    return req


@app.get("/alerts", response_model=list[AlertOut])
def list_alerts(user: User = Depends(_current_user), session: Session = Depends(get_session)) -> list[AlertOut]:
    items = session.scalars(
        select(Alert).where(Alert.user_id == user.id).order_by(Alert.created_at.desc())
    ).all()
    return [
        AlertOut(
            id=a.id,
            kind=a.kind,
            product_id=a.product_id,
            message=a.message,
            payload=a.payload,
            created_at=a.created_at,
            read_at=a.read_at,
        )
        for a in items
    ]


@app.post("/research", response_model=ResearchJob)
def create_research(
    options: ResearchOptions,
    user: User | None = Depends(_optional_user),
    session: Session = Depends(get_session),
) -> ResearchJob:
    entries = repository.load_catalog(session)
    params = repository.load_cost_params(session)
    result = services.compute_research_result(options, entries=entries, params=params)
    job_id = f"job-{uuid.uuid4().hex[:12]}"
    return repository.save_research_job(
        session, job_id, options, result, user_id=user.id if user else None
    )


@app.get("/research/{job_id}", response_model=ResearchJob)
def get_research(job_id: str, session: Session = Depends(get_session)) -> ResearchJob:
    job = repository.load_research_job(session, job_id)
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


def _find_entry(session: Session, product_id: str):
    entries = repository.load_catalog(session)
    entry = next((e for e in entries if e.id == product_id), None)
    if entry is None:
        raise HTTPException(status_code=404, detail="product not found")
    return entry


@app.get("/products/{product_id}/price-history", response_model=PriceHistoryResponse)
def get_price_history(product_id: str, session: Session = Depends(get_session)) -> PriceHistoryResponse:
    entry = _find_entry(session, product_id)
    jp_rows = repository.load_price_history(session, product_id, "JP")
    cn_rows = repository.load_price_history(session, product_id, "CN")
    return timeseries.build_price_history(entry, jp_rows, cn_rows, datetime.now(timezone.utc))


@app.get("/products/{product_id}/forecast", response_model=ProductForecastResponse)
def get_forecast(product_id: str, session: Session = Depends(get_session)) -> ProductForecastResponse:
    entry = _find_entry(session, product_id)
    params = repository.load_cost_params(session)
    best_direction = opportunity_engine.evaluate(entry, params).best.direction
    sell_market = "JP" if best_direction == TradeDirection.CN_TO_JP else "CN"
    sell_rows = repository.load_price_history(session, product_id, sell_market)
    return timeseries.build_forecast(entry, best_direction, sell_rows, datetime.now(timezone.utc))


@app.get("/products/{product_id}/oem-analysis", response_model=OemAnalysis)
def get_oem_analysis(product_id: str, session: Session = Depends(get_session)) -> OemAnalysis:
    entry = _find_entry(session, product_id)
    return oem.analyze_oem(entry)


@app.get("/products/{product_id}/similar", response_model=list[SimilarProduct])
def get_similar(
    product_id: str, limit: int = Query(default=5, ge=1, le=20), session: Session = Depends(get_session)
) -> list[SimilarProduct]:
    entries = repository.load_catalog(session)
    target = next((e for e in entries if e.id == product_id), None)
    if target is None:
        raise HTTPException(status_code=404, detail="product not found")
    return similar.find_similar(target, entries, limit=limit)


@app.get("/products/{product_id}/reviews", response_model=ReviewAnalysis)
def get_reviews(product_id: str, session: Session = Depends(get_session)) -> ReviewAnalysis:
    entry = _find_entry(session, product_id)
    params = repository.load_cost_params(session)
    direction = opportunity_engine.evaluate(entry, params).best.direction
    return reviews.analyze_reviews(entry, direction)


@app.get("/products/{product_id}/image-comparison", response_model=ImageComparison)
def get_image_comparison(product_id: str, session: Session = Depends(get_session)) -> ImageComparison:
    entry = _find_entry(session, product_id)
    return images.compare_images(entry)


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


@app.get("/markets/keywords", response_model=list[KeywordGap])
def get_keyword_gaps(session: Session = Depends(get_session)) -> list[KeywordGap]:
    entries = repository.load_catalog(session)
    return keywords.keyword_gaps(entries)


@app.get("/seasonal", response_model=list[SeasonalOpportunity])
def get_seasonal(session: Session = Depends(get_session)) -> list[SeasonalOpportunity]:
    entries = repository.load_catalog(session)
    params = repository.load_cost_params(session)
    return services.get_seasonal_opportunities(entries=entries, params=params)


@app.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(session: Session = Depends(get_session)) -> DashboardResponse:
    entries = repository.load_catalog(session)
    params = repository.load_cost_params(session)
    return insights.get_dashboard(entries, params)


@app.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(session: Session = Depends(get_session)) -> AnalyticsResponse:
    entries = repository.load_catalog(session)
    params = repository.load_cost_params(session)
    return insights.get_analytics(entries, params)


@app.get("/analytics/brands", response_model=list[BrandStat])
def get_brand_analysis(session: Session = Depends(get_session)) -> list[BrandStat]:
    entries = repository.load_catalog(session)
    return brands.brand_analysis(entries)


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
