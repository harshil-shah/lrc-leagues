import os
from dotenv import load_dotenv
from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./league.db")


def get_engine_args() -> dict:
    if DATABASE_URL.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {}


engine = create_engine(DATABASE_URL, **get_engine_args())
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
