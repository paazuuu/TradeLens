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

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import repository, services
from .db import SessionLocal, get_session, init_db
from .schemas import (
    MarketsResponse,
    Opportunity,
    ProductDetail,
    ProfitSimulateRequest,
    ProfitSimulateResponse,
    ResearchJob,
    ResearchOptions,
    SeasonalOpportunity,
    TradeDirection,
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


@app.post("/research", response_model=ResearchJob)
def create_research(options: ResearchOptions, session: Session = Depends(get_session)) -> ResearchJob:
    entries = repository.load_catalog(session)
    result = services.compute_research_result(options, entries=entries)
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
    return services.list_opportunities(
        direction=direction, min_score=min_score, min_margin=min_margin, entries=entries
    )


@app.get("/products/{product_id}", response_model=ProductDetail)
def get_product(product_id: str, session: Session = Depends(get_session)) -> ProductDetail:
    entries = repository.load_catalog(session)
    detail = services.get_product_detail(product_id, entries=entries)
    if detail is None:
        raise HTTPException(status_code=404, detail="product not found")
    return detail


@app.post("/profit/simulate", response_model=ProfitSimulateResponse)
def post_profit_simulate(req: ProfitSimulateRequest) -> ProfitSimulateResponse:
    return services.simulate_profit(req)


@app.get("/markets", response_model=MarketsResponse)
def get_markets(session: Session = Depends(get_session)) -> MarketsResponse:
    entries = repository.load_catalog(session)
    return MarketsResponse(
        overview=services.get_market_overview(entries=entries),
        comparison=services.get_market_comparison(entries=entries),
    )


@app.get("/seasonal", response_model=list[SeasonalOpportunity])
def get_seasonal(session: Session = Depends(get_session)) -> list[SeasonalOpportunity]:
    entries = repository.load_catalog(session)
    return services.get_seasonal_opportunities(entries=entries)
