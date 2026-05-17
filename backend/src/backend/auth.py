import os
from fastapi import HTTPException, Header
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"])


def check_admin(password: str = Header(alias="x-admin-password")) -> None:
    hash = os.getenv("ADMIN_PASSWORD_HASH")
    if hash is None:
        raise HTTPException(status_code=500, detail="ADMIN_PASSWORD_HASH not configured")
    if not pwd_context.verify(password, hash):
        raise HTTPException(status_code=401, detail="Invalid admin password")


def verify_league_admin(password: str, league_admin_password_hash: str) -> None:
    if not pwd_context.verify(password, league_admin_password_hash):
        raise HTTPException(status_code=401, detail="Invalid league admin password")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)
