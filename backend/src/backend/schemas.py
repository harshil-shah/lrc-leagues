from datetime import datetime

from pydantic import BaseModel

from backend.models import LeagueStatus


class PlayerCreate(BaseModel):
    name: str


class PlayerUpdate(BaseModel):
    name: str


class PlayerDivisionUpdate(BaseModel):
    division_id: int | None


class PlayerResponse(BaseModel):
    id: int
    name: str
    league_id: int
    division_id: int | None
    has_matches: bool

    model_config = {"from_attributes": False}


class LeagueCreate(BaseModel):
    name: str
    admin_password: str


class LeagueSetup(BaseModel):
    ends_at: datetime | None
    base_win_points: float
    base_loss_points: float
    multiplier: float
    num_divisions: int


class LeagueUpdate(BaseModel):
    name: str
    ends_at: datetime | None
    base_win_points: float
    base_loss_points: float
    multiplier: float


class LeagueResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    ends_at: datetime | None
    is_active: bool
    status: LeagueStatus
    base_win_points: float
    base_loss_points: float
    multiplier: float

    model_config = {"from_attributes": True}


class DivisionCreate(BaseModel):
    name: str
    rank: int


class DivisionUpdate(BaseModel):
    name: str
    rank: int


class DivisionResponse(BaseModel):
    id: int
    league_id: int
    name: str
    rank: int

    model_config = {"from_attributes": True}


class MatchCreate(BaseModel):
    league_id: int
    team_a_player_1_id: int
    team_a_player_2_id: int
    team_b_player_1_id: int
    team_b_player_2_id: int
    team_a_score: int
    team_b_score: int
    played_at: datetime | None = None


class MatchUpdate(BaseModel):
    team_a_score: int
    team_b_score: int
    played_at: datetime


class MatchPlayerDetail(BaseModel):
    player_id: int
    player_name: str
    division_id: int
    division_name: str
    division_rank: int
    points_earned: float


class MatchDetailResponse(BaseModel):
    id: int
    league_id: int
    team_a_player_1: MatchPlayerDetail
    team_a_player_2: MatchPlayerDetail
    team_b_player_1: MatchPlayerDetail
    team_b_player_2: MatchPlayerDetail
    team_a_score: int
    team_b_score: int
    played_at: datetime

    model_config = {"from_attributes": False}


class PlayerStanding(BaseModel):
    player_id: int
    player_name: str
    matches_played: int
    wins: int
    losses: int
    points: float
    points_for: int
    points_against: int


class DivisionStandings(BaseModel):
    division_id: int
    division_name: str
    division_rank: int
    standings: list[PlayerStanding]
