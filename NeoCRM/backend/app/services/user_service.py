from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.security import hash_password
from app.models.user import User, UserStatus
from app.models.role import Role
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def get_by_id(self, db: Session, user_id: str) -> User | None:
        return (
            db.query(User)
            .options(joinedload(User.roles))
            .filter(User.id == user_id)
            .first()
        )

    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    def list_users(
        self,
        db: Session,
        organization_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[User], int]:
        q = (
            db.query(User)
            .options(joinedload(User.roles))
            .filter(User.organization_id == organization_id)
        )
        total = q.count()
        users = q.offset((page - 1) * limit).limit(limit).all()
        return users, total

    def create_user(
        self,
        db: Session,
        data: UserCreate,
        organization_id: str,
    ) -> User:
        roles = db.query(Role).filter(Role.id.in_(data.role_ids)).all() if data.role_ids else []
        user = User(
            email=data.email.lower().strip(),
            hashed_password=hash_password(data.password),
            full_name=data.full_name.strip(),
            organization_id=organization_id,
            roles=roles,
        )
        db.add(user)
        db.flush()
        return user

    def update_user(self, db: Session, user: User, data: UserUpdate) -> User:
        if data.full_name is not None:
            user.full_name = data.full_name.strip()
        if data.status is not None:
            user.status = UserStatus(data.status)
        if data.role_ids is not None:
            user.roles = db.query(Role).filter(Role.id.in_(data.role_ids)).all()
        db.add(user)
        db.flush()
        return user

    def deactivate_user(self, db: Session, user: User) -> User:
        user.status = UserStatus.inactive
        db.add(user)
        db.flush()
        return user


user_service = UserService()
