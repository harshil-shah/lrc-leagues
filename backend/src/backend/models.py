import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum as SAEnum, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.constants import (
    DEFAULT_BASE_LOSS_POINTS,
    DEFAULT_BASE_WIN_POINTS,
    DEFAULT_MULTIPLIER,
)
from backend.database import Base


class LeagueStatus(enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"


class League(Base):
    __tablename__ = "leagues"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(), unique=True)
    admin_password_hash: Mapped[str] = mapped_column(String())
    status: Mapped[LeagueStatus] = mapped_column(SAEnum(LeagueStatus), default=LeagueStatus.PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    base_win_points: Mapped[float] = mapped_column(Float(), default=DEFAULT_BASE_WIN_POINTS)
    base_loss_points: Mapped[float] = mapped_column(Float(), default=DEFAULT_BASE_LOSS_POINTS)
    multiplier: Mapped[float] = mapped_column(Float(), default=DEFAULT_MULTIPLIER)

    divisions: Mapped[list["Division"]] = relationship(cascade="all, delete-orphan", passive_deletes=True)
    matches: Mapped[list["Match"]] = relationship(cascade="all, delete-orphan", passive_deletes=True)
    players: Mapped[list["Player"]] = relationship(cascade="all, delete-orphan", passive_deletes=True)

    @property
    def is_active(self) -> bool:
        if self.status != LeagueStatus.ACTIVE:
            return False
        if self.ends_at is None:
            return True
        ends_at = self.ends_at
        if ends_at.tzinfo is None:
            ends_at = ends_at.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) < ends_at


class Division(Base):
    __tablename__ = "divisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    league_id: Mapped[int] = mapped_column(ForeignKey("leagues.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String())
    rank: Mapped[int] = mapped_column()

    __table_args__ = (UniqueConstraint("league_id", "name"),)


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String())
    league_id: Mapped[int] = mapped_column(ForeignKey("leagues.id", ondelete="CASCADE"))
    division_id: Mapped[int | None] = mapped_column(ForeignKey("divisions.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (UniqueConstraint("league_id", "name"),)


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True)
    league_id: Mapped[int] = mapped_column(ForeignKey("leagues.id", ondelete="CASCADE"))
    team_a_player_1_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    team_a_player_2_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    team_b_player_1_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    team_b_player_2_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    team_a_score: Mapped[int] = mapped_column()
    team_b_score: Mapped[int] = mapped_column()
    played_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
