from datetime import datetime, timedelta, timezone
import uuid
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.core.config import settings
ph = PasswordHasher()
def hash_password(password: str) -> str: return ph.hash(password)
def verify_password(password_hash: str, password: str) -> bool:
    try: return ph.verify(password_hash, password)
    except VerifyMismatchError: return False
def create_access_token(user_id: str):
    now = datetime.now(timezone.utc); exp = now + timedelta(minutes=settings.access_token_expire_minutes); jti = str(uuid.uuid4())
    token = jwt.encode({"sub": user_id, "jti": jti, "iat": now, "exp": exp}, settings.secret_key, algorithm="HS256")
    return token, jti, exp
def decode_token(token: str): return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
