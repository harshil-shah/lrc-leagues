from fastapi import Depends, HTTPException, Header
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth import check_admin, verify_league_admin, hash_password
from backend.database import get_db
from backend.models import Division, League, LeagueStatus
from backend.routers.leagues import router
from backend.schemas import LeagueCreate, LeagueResponse, LeagueSetup, LeagueUpdate


@router.get("/", response_model=list[LeagueResponse])
def get_leagues(db: Session = Depends(get_db)) -> list[League]:
    return db.query(League).all()


@router.get("/{league_id}", response_model=LeagueResponse)
def get_league(league_id: int, db: Session = Depends(get_db)) -> League:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    return db_league


@router.post("/verify-admin/{league_id}")
def verify_league_admin_endpoint(
    league_id: int,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> dict[str, bool]:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    return {"ok": True}


@router.post("/", response_model=LeagueResponse, dependencies=[Depends(check_admin)])
def create_league(league: LeagueCreate, db: Session = Depends(get_db)) -> League:
    db_league = League(
        name=league.name,
        admin_password_hash=hash_password(league.admin_password),
    )
    db.add(db_league)
    try:
        db.commit()
        db.refresh(db_league)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"League with name '{league.name}' already exists")
    return db_league


@router.post("/{league_id}/setup", response_model=LeagueResponse)
def setup_league(
    league_id: int,
    setup: LeagueSetup,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> League:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    if db_league.status != LeagueStatus.PENDING:
        raise HTTPException(status_code=409, detail="League is already published")
    db_league.ends_at = setup.ends_at
    db_league.base_win_points = setup.base_win_points
    db_league.base_loss_points = setup.base_loss_points
    db_league.multiplier = setup.multiplier
    db_league.status = LeagueStatus.ACTIVE
    for i in range(1, setup.num_divisions + 1):
        db.add(Division(league_id=league_id, name=f"Division {i}", rank=i))
    db.commit()
    db.refresh(db_league)
    return db_league


@router.patch("/{league_id}", response_model=LeagueResponse)
def update_league(
    league_id: int,
    league: LeagueUpdate,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> League:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    db_league.name = league.name
    db_league.ends_at = league.ends_at
    db_league.base_win_points = league.base_win_points
    db_league.base_loss_points = league.base_loss_points
    db_league.multiplier = league.multiplier
    try:
        db.commit()
        db.refresh(db_league)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"League with name '{league.name}' already exists")
    return db_league


@router.delete("/{league_id}", dependencies=[Depends(check_admin)])
def delete_league(league_id: int, db: Session = Depends(get_db)) -> None:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    db.delete(db_league)
    db.commit()
