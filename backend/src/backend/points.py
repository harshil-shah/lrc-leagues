from backend.models import League


def calculate_points(
    league: League,
    my_division_rank: int,
    partner_division_rank: int,
    opponent_1_division_rank: int,
    opponent_2_division_rank: int,
    won: bool,
) -> float:
    avg_my_team_rank = (my_division_rank + partner_division_rank) / 2
    avg_opponent_rank = (opponent_1_division_rank + opponent_2_division_rank) / 2
    strength_diff = avg_my_team_rank - avg_opponent_rank

    if won:
        return league.base_win_points + strength_diff * league.multiplier
    else:
        return min(league.base_loss_points, league.base_loss_points + strength_diff * league.multiplier)
