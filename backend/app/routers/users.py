from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, Team
from backend.app.schemas import UserResponse, TeamResponse

router = APIRouter(prefix="/api", tags=["Users & Teams"])


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """Returns all users across the organization."""
    return db.query(User).order_by(User.id).all()


@router.get("/teams", response_model=list[TeamResponse])
def list_teams(db: Session = Depends(get_db)):
    """Returns all departments / teams."""
    return db.query(Team).order_by(Team.id).all()

