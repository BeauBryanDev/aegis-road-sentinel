from typing import Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.users import User
from app.schemas.user_schema import UserCreate, UserUpdate

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username.strip()).first()


def create(db: Session, payload: UserCreate) -> User:
    user = User(
        full_name=payload.full_name.strip(),
        username=payload.username.strip(),
        email=payload.email.lower().strip(),
        hashed_password=_pwd.hash(payload.password),
        phone_number=payload.phone_number,
        gender=payload.gender,
        country=payload.country,
        address=payload.address,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update(db: Session, user: User, payload: UserUpdate) -> User:
    # exclude_unset drops fields the client never sent;
    # exclude_none drops fields explicitly sent as null (Swagger sends all fields,
    # so without this, null values would overwrite NOT NULL DB columns).
    data = payload.model_dump(exclude_unset=True, exclude_none=True)

    if "password" in data:
        user.hashed_password = _pwd.hash(data.pop("password"))

    if "email" in data:
        data["email"] = data["email"].lower().strip()

    if "username" in data:
        data["username"] = data["username"].strip()

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def deactivate(db: Session, user: User) -> User:
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


def delete(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)
