from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload

from app.core.security import verify_password, create_access_token
from app.models.user import User


class AuthService:
    def authenticate(self, db: Session, email: str, password: str) -> User | None:
        user = (
            db.query(User)
            .options(joinedload(User.roles).joinedload("permissions"))
            .filter(User.email == email.lower().strip())
            .first()
        )
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if user.status != "active":
            return None
        return user

    def record_login(self, db: Session, user: User) -> None:
        user.last_login_at = datetime.now(timezone.utc)
        db.add(user)
        db.commit()

    def build_token(self, user: User) -> str:
        return create_access_token(subject=user.id)


auth_service = AuthService()
