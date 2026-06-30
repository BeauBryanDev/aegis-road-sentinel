from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.session import get_db
from app.models.users import User
from app.routers.deps import get_current_user
from app.schemas.user_schema import UserResponse, UserUpdate
from app.services import user_crud_service as svc

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's own profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the authenticated user's own profile.
    Only fields included in the request body are changed (PATCH semantics).
    Changing email or username raises 409 if the new value is already taken.
    """
    data = payload.model_dump(exclude_unset=True)

    if "email" in data:
        existing = svc.get_by_email(db, data["email"])
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=409, detail="Email already in use.")

    if "username" in data:
        existing = svc.get_by_username(db, data["username"])
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=409, detail="Username already taken.")

    return svc.update(db, current_user, payload)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete the authenticated user's own account."""
    svc.delete(db, current_user)


# ---------------------------------------------------------------------------
# Admin-style endpoints (operate on any user by id).
# No role system yet — these are open to any authenticated user.
# Add an is_admin / is_superuser guard here when roles are introduced.
# ---------------------------------------------------------------------------

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Fetch any user by id. Requires authentication."""
    user = svc.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update another user's profile. Requires authentication."""
    user = svc.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    data = payload.model_dump(exclude_unset=True)

    if "email" in data:
        existing = svc.get_by_email(db, data["email"])
        if existing and existing.id != user_id:
            raise HTTPException(status_code=409, detail="Email already in use.")

    if "username" in data:
        existing = svc.get_by_username(db, data["username"])
        if existing and existing.id != user_id:
            raise HTTPException(status_code=409, detail="Username already taken.")

    return svc.update(db, user, payload)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a user by id. Requires authentication."""
    user = svc.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    svc.delete(db, user)
