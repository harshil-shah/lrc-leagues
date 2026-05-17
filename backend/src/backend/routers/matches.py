from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Division, League, Match, Player
from backend.points import calculate_points
from backend.schemas import MatchCreate, MatchDetailResponse, MatchPlayerDetail, MatchUpdate

router = APIRouter(prefix="/matches", tags=["matches"])


def get_player_with_division(player_id: int, league_id: int, db: Session) -> tuple[Player, Division]:
    player = db.get(Player, player_id)
    if player is None or player.league_id != league_id:
        raise HTTPException(status_code=404, detail=f"Player {player_id} not found in league {league_id}")
    if player.division_id is None:
        raise HTTPException(status_code=400, detail=f"Player '{player.name}' has not been assigned to a division")
    division = db.get(Division, player.division_id)
    if division is None:
        raise HTTPException(status_code=404, detail=f"Division for player '{player.name}' not found")
    return player, division


def build_player_detail(
    player: Player,
    division: Division,
    partner_division: Division,
    opp1_division: Division,
    opp2_division: Division,
    won: bool,
    league: League,
) -> MatchPlayerDetail:
    return MatchPlayerDetail(
        player_id=player.id,
        player_name=player.name,
        division_id=division.id,
        division_name=division.name,
        division_rank=division.rank,
        points_earned=calculate_points(
            league=league,
            my_division_rank=division.rank,
            partner_division_rank=partner_division.rank,
            opponent_1_division_rank=opp1_division.rank,
            opponent_2_division_rank=opp2_division.rank,
            won=won,
        ),
    )


def build_match_detail(match: Match, db: Session) -> MatchDetailResponse:
    league = db.get(League, match.league_id)
    if league is None:
        raise HTTPException(status_code=404, detail=f"League {match.league_id} not found")

    p1, d1 = get_player_with_division(match.team_a_player_1_id, match.league_id, db)
    p2, d2 = get_player_with_division(match.team_a_player_2_id, match.league_id, db)
    p3, d3 = get_player_with_division(match.team_b_player_1_id, match.league_id, db)
    p4, d4 = get_player_with_division(match.team_b_player_2_id, match.league_id, db)

    team_a_won = match.team_a_score > match.team_b_score

    return MatchDetailResponse(
        id=match.id,
        league_id=match.league_id,
        team_a_player_1=build_player_detail(p1, d1, d2, d3, d4, team_a_won, league),
        team_a_player_2=build_player_detail(p2, d2, d1, d3, d4, team_a_won, league),
        team_b_player_1=build_player_detail(p3, d3, d4, d1, d2, not team_a_won, league),
        team_b_player_2=build_player_detail(p4, d4, d3, d1, d2, not team_a_won, league),
        team_a_score=match.team_a_score,
        team_b_score=match.team_b_score,
        played_at=match.played_at,
    )


@router.get("/", response_model=list[MatchDetailResponse])
def get_matches(league_id: int, db: Session = Depends(get_db)) -> list[MatchDetailResponse]:
    matches = db.query(Match).filter(Match.league_id == league_id).all()
    return [build_match_detail(match, db) for match in matches]


@router.post("/", response_model=MatchDetailResponse)
def create_match(match: MatchCreate, db: Session = Depends(get_db)) -> MatchDetailResponse:
    league = db.get(League, match.league_id)
    if league is None:
        raise HTTPException(status_code=404, detail=f"League {match.league_id} not found")

    get_player_with_division(match.team_a_player_1_id, match.league_id, db)
    get_player_with_division(match.team_a_player_2_id, match.league_id, db)
    get_player_with_division(match.team_b_player_1_id, match.league_id, db)
    get_player_with_division(match.team_b_player_2_id, match.league_id, db)

    db_match = Match(
        league_id=match.league_id,
        team_a_player_1_id=match.team_a_player_1_id,
        team_a_player_2_id=match.team_a_player_2_id,
        team_b_player_1_id=match.team_b_player_1_id,
        team_b_player_2_id=match.team_b_player_2_id,
        team_a_score=match.team_a_score,
        team_b_score=match.team_b_score,
        played_at=match.played_at or datetime.now(timezone.utc),
    )
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return build_match_detail(db_match, db)


@router.patch("/{match_id}", response_model=MatchDetailResponse)
def update_match(match_id: int, match: MatchUpdate, db: Session = Depends(get_db)) -> MatchDetailResponse:
    db_match = db.get(Match, match_id)
    if db_match is None:
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")
    db_match.team_a_score = match.team_a_score
    db_match.team_b_score = match.team_b_score
    db_match.played_at = match.played_at
    db.commit()
    db.refresh(db_match)
    return build_match_detail(db_match, db)


@router.delete("/{match_id}")
def delete_match(match_id: int, db: Session = Depends(get_db)) -> None:
    db_match = db.get(Match, match_id)
    if db_match is None:
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")
    db.delete(db_match)
    db.commit()
