"""FastAPI アプリ本体。docs/development_plan.md STEP 5（Backend基盤）のエンドポイント。

エンドポイント（セクション 72）:
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

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import services
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

app = FastAPI(
    title="CrossBorder Opportunity AI API",
    description="日中越境商品リサーチAI のバックエンド（MVP / モックデータ）。",
    version="0.1.0",
)

# フロント（Next.js）からの呼び出しを許可する。既定は localhost:3000。
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
_allowed_origins = os.getenv("CORS_ORIGINS", _default_origins).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

# リサーチジョブのインメモリ保存（MVP）。実運用では DB（research_jobs）へ移す。
_research_jobs: dict[str, ResearchJob] = {}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/research", response_model=ResearchJob)
def create_research(options: ResearchOptions) -> ResearchJob:
    result = services.compute_research_result(options)
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
) -> list[Opportunity]:
    return services.list_opportunities(direction=direction, min_score=min_score, min_margin=min_margin)


@app.get("/products/{product_id}", response_model=ProductDetail)
def get_product(product_id: str) -> ProductDetail:
    detail = services.get_product_detail(product_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="product not found")
    return detail


@app.post("/profit/simulate", response_model=ProfitSimulateResponse)
def post_profit_simulate(req: ProfitSimulateRequest) -> ProfitSimulateResponse:
    return services.simulate_profit(req)


@app.get("/markets", response_model=MarketsResponse)
def get_markets() -> MarketsResponse:
    return MarketsResponse(overview=services.get_market_overview(), comparison=services.get_market_comparison())


@app.get("/seasonal", response_model=list[SeasonalOpportunity])
def get_seasonal() -> list[SeasonalOpportunity]:
    return services.get_seasonal_opportunities()
