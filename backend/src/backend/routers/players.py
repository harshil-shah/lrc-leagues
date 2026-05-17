from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth import verify_league_admin
from backend.database import get_db
from backend.models import Division, League, Match, Player
from backend.schemas import PlayerCreate, PlayerDivisionUpdate, PlayerResponse, PlayerUpdate

router = APIRouter(prefix="/leagues", tags=["players"])


def player_to_response(player: Player, db: Session) -> PlayerResponse:
    has_matches = db.query(Match).filter(
        or_(
            Match.team_a_player_1_id == player.id,
            Match.team_a_player_2_id == player.id,
            Match.team_b_player_1_id == player.id,
            Match.team_b_player_2_id == player.id,
        )
    ).first() is not None
    return PlayerResponse(
        id=player.id,
        name=player.name,
        league_id=player.league_id,
        division_id=player.division_id,
        has_matches=has_matches,
    )


@router.get("/{league_id}/players", response_model=list[PlayerResponse])
def get_players(league_id: int, db: Session = Depends(get_db)) -> list[PlayerResponse]:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    players = db.query(Player).filter(Player.league_id == league_id).all()
    return [player_to_response(p, db) for p in players]


@router.post("/{league_id}/players", response_model=PlayerResponse)
def create_player(
    league_id: int,
    player: PlayerCreate,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> PlayerResponse:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    db_player = Player(name=player.name, league_id=league_id)
    db.add(db_player)
    try:
        db.commit()
        db.refresh(db_player)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Player with name '{player.name}' already exists in this league")
    return player_to_response(db_player, db)


@router.patch("/{league_id}/players/{player_id}", response_model=PlayerResponse)
def update_player(
    league_id: int,
    player_id: int,
    player: PlayerUpdate,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> PlayerResponse:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    db_player = db.get(Player, player_id)
    if db_player is None or db_player.league_id != league_id:
        raise HTTPException(status_code=404, detail=f"Player {player_id} not found in league {league_id}")
    db_player.name = player.name
    try:
        db.commit()
        db.refresh(db_player)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Player with name '{player.name}' already exists in this league")
    return player_to_response(db_player, db)


@router.delete("/{league_id}/players/{player_id}")
def delete_player(
    league_id: int,
    player_id: int,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> None:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    db_player = db.get(Player, player_id)
    if db_player is None or db_player.league_id != league_id:
        raise HTTPException(status_code=404, detail=f"Player {player_id} not found in league {league_id}")
    has_matches = db.query(Match).filter(
        or_(
            Match.team_a_player_1_id == player_id,
            Match.team_a_player_2_id == player_id,
            Match.team_b_player_1_id == player_id,
            Match.team_b_player_2_id == player_id,
        )
    ).first() is not None
    if has_matches:
        raise HTTPException(status_code=409, detail=f"Player {player_id} has match history and cannot be deleted")
    db.delete(db_player)
    db.commit()


@router.patch("/{league_id}/players/{player_id}/division", response_model=PlayerResponse)
def assign_player_division(
    league_id: int,
    player_id: int,
    body: PlayerDivisionUpdate,
    x_league_password: str = Header(),
    db: Session = Depends(get_db)
) -> PlayerResponse:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    verify_league_admin(x_league_password, db_league.admin_password_hash)
    db_player = db.get(Player, player_id)
    if db_player is None or db_player.league_id != league_id:
        raise HTTPException(status_code=404, detail=f"Player {player_id} not found in league {league_id}")
    if body.division_id is not None:
        db_division = db.get(Division, body.division_id)
        if db_division is None or db_division.league_id != league_id:
            raise HTTPException(status_code=404, detail=f"Division {body.division_id} not found in league {league_id}")
    db_player.division_id = body.division_id
    db.commit()
    db.refresh(db_player)
    return player_to_response(db_player, db)
