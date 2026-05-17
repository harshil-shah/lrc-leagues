import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.auth import check_admin
from backend.constants import DEFAULT_BASE_LOSS_POINTS, DEFAULT_BASE_WIN_POINTS, DEFAULT_MULTIPLIER, DEFAULT_NUM_DIVISIONS
from backend.database import Base, engine
from backend.models import Division, League, Match, Player  # noqa: F401
from backend.routers import matches, players
from backend.routers.leagues import divisions, leagues, standings  # noqa: F401
from backend.routers.leagues import router as leagues_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    Base.metadata.create_all(bind=engine)
    yield


FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI(title="Roundnet League", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        FRONTEND_URL,
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router)
app.include_router(matches.router)
app.include_router(leagues_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/admin/verify")
async def verify_admin(_: None = Depends(check_admin)) -> dict[str, bool]:
    return {"ok": True}


@app.get("/league-defaults")
async def get_league_defaults() -> dict[str, float | int]:
    return {
        "base_win_points": DEFAULT_BASE_WIN_POINTS,
        "base_loss_points": DEFAULT_BASE_LOSS_POINTS,
        "multiplier": DEFAULT_MULTIPLIER,
        "num_divisions": DEFAULT_NUM_DIVISIONS,
    }
