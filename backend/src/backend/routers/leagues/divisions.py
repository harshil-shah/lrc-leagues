from fastapi import Depends, HTTPException, Header
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth import verify_league_admin
from backend.database import get_db
from backend.models import Division, League, Match, Player
from backend.routers.leagues import router
from backend.schemas import DivisionCreate, DivisionResponse, DivisionUpdate


@router.get("/{league_id}/divisions", response_model=list[DivisionResponse])
def get_divisions(league_id: int, db: Session = Depends(get_db)) -> list[Division]:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    return db.query(Division).filter(Division.league_id == league_id).order_by(Division.rank).all()


@router.post("/{league_id}/divisions", response_model=DivisionResponse)
def create_division(
    league_id: int,
    division: DivisionCreate,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> Division:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    db_division = Division(league_id=league_id, name=division.name, rank=division.rank)
    db.add(db_division)
    try:
        db.commit()
        db.refresh(db_division)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Division with name '{division.name}' already exists in this league")
    return db_division


@router.patch("/{league_id}/divisions/{division_id}", response_model=DivisionResponse)
def update_division(
    league_id: int,
    division_id: int,
    division: DivisionUpdate,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> Division:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    db_division = db.get(Division, division_id)
    if db_division is None or db_division.league_id != league_id:
        raise HTTPException(status_code=404, detail=f"Division {division_id} not found in league {league_id}")
    db_division.name = division.name
    db_division.rank = division.rank
    try:
        db.commit()
        db.refresh(db_division)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Division with name '{division.name}' already exists in this league")
    return db_division


@router.delete("/{league_id}/divisions/{division_id}")
def delete_division(
    league_id: int,
    division_id: int,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> None:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    db_division = db.get(Division, division_id)
    if db_division is None or db_division.league_id != league_id:
        raise HTTPException(status_code=404, detail=f"Division {division_id} not found in league {league_id}")

    # Check no players in this division have played matches
    players_in_division = db.query(Player).filter(Player.division_id == division_id).all()
    for player in players_in_division:
        has_matches = db.query(Match).filter(
            (Match.team_a_player_1_id == player.id) |
            (Match.team_a_player_2_id == player.id) |
            (Match.team_b_player_1_id == player.id) |
            (Match.team_b_player_2_id == player.id)
        ).first() is not None
        if has_matches:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot delete division — player '{player.name}' has match history"
            )

    deleted_rank = db_division.rank
    db.delete(db_division)
    db.flush()

    # Rerank and rename remaining divisions
    remaining = db.query(Division).filter(
        Division.league_id == league_id,
        Division.rank > deleted_rank
    ).order_by(Division.rank).all()

    for division in remaining:
        division.rank -= 1
        division.name = f"Division {division.rank}"

    db.commit()
