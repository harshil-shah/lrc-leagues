from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Division, League, Match, Player
from backend.points import calculate_points
from backend.routers.leagues import router
from backend.schemas import DivisionStandings, PlayerStanding


@router.get("/{league_id}/standings", response_model=list[DivisionStandings])
def get_standings(league_id: int, db: Session = Depends(get_db)) -> list[DivisionStandings]:
    db_league = db.get(League, league_id)
    if db_league is None:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")

    divisions = (
        db.query(Division)
        .filter(Division.league_id == league_id)
        .order_by(Division.rank)
        .all()
    )

    matches = db.query(Match).filter(Match.league_id == league_id).all()

    # Build a map of player_id -> (player, division) for quick lookup
    players = db.query(Player).filter(Player.league_id == league_id).all()
    player_map: dict[int, Player] = {p.id: p for p in players}
    division_map: dict[int, Division] = {d.id: d for d in divisions}

    result = []
    for division in divisions:
        division_players = [p for p in players if p.division_id == division.id]

        player_stats: dict[int, dict] = {}
        for player in division_players:
            player_stats[player.id] = {
                "player_id": player.id,
                "player_name": player.name,
                "matches_played": 0,
                "wins": 0,
                "losses": 0,
                "points": 0.0,
                "points_for": 0,
                "points_against": 0,
            }

        for match in matches:
            team_a_ids = [match.team_a_player_1_id, match.team_a_player_2_id]
            team_b_ids = [match.team_b_player_1_id, match.team_b_player_2_id]
            all_ids = team_a_ids + team_b_ids

            # Skip match if any player is missing or unassigned
            if not all(pid in player_map for pid in all_ids):
                continue
            if not all(player_map[pid].division_id is not None for pid in all_ids):
                continue

            division_ranks: dict[int, int] = {}
            for pid in all_ids:
                player = player_map[pid]
                if player.division_id is not None:
                    div = division_map.get(player.division_id)
                    if div is not None:
                        division_ranks[pid] = div.rank

            if len(division_ranks) != 4:
                continue

            team_a_won = match.team_a_score > match.team_b_score

            for pid in team_a_ids:
                if pid not in player_stats:
                    continue
                partner_id = team_a_ids[1] if pid == team_a_ids[0] else team_a_ids[0]
                points = calculate_points(
                    league=db_league,
                    my_division_rank=division_ranks[pid],
                    partner_division_rank=division_ranks[partner_id],
                    opponent_1_division_rank=division_ranks[team_b_ids[0]],
                    opponent_2_division_rank=division_ranks[team_b_ids[1]],
                    won=team_a_won,
                )
                player_stats[pid]["matches_played"] += 1
                player_stats[pid]["wins"] += 1 if team_a_won else 0
                player_stats[pid]["losses"] += 1 if not team_a_won else 0
                player_stats[pid]["points"] += points
                player_stats[pid]["points_for"] += match.team_a_score
                player_stats[pid]["points_against"] += match.team_b_score

            for pid in team_b_ids:
                if pid not in player_stats:
                    continue
                partner_id = team_b_ids[1] if pid == team_b_ids[0] else team_b_ids[0]
                points = calculate_points(
                    league=db_league,
                    my_division_rank=division_ranks[pid],
                    partner_division_rank=division_ranks[partner_id],
                    opponent_1_division_rank=division_ranks[team_a_ids[0]],
                    opponent_2_division_rank=division_ranks[team_a_ids[1]],
                    won=not team_a_won,
                )
                player_stats[pid]["matches_played"] += 1
                player_stats[pid]["wins"] += 1 if not team_a_won else 0
                player_stats[pid]["losses"] += 1 if team_a_won else 0
                player_stats[pid]["points"] += points
                player_stats[pid]["points_for"] += match.team_b_score
                player_stats[pid]["points_against"] += match.team_a_score

        standings = sorted(
            player_stats.values(),
            key=lambda x: (x["points"], x["points_for"] - x["points_against"]),
            reverse=True,
        )

        result.append(DivisionStandings(
            division_id=division.id,
            division_name=division.name,
            division_rank=division.rank,
            standings=[PlayerStanding(**s) for s in standings],
        ))

    return result
