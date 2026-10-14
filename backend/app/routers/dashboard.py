from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from backend.app.database import get_db
from backend.app.models import Goal, CheckIn, Escalation

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    SQL-backed dashboard metrics:
    - total_goals: Total count of goals
    - completed_goals: Goals marked completed or having completed check-in
    - overdue_goals: Goals past timeline target date or with open overdue escalation
    - in_progress_goals: Active incomplete goals
    """
    today_str = date.today().isoformat()

    total_goals = db.query(Goal).count()

    # Completed: status == 'completed' OR has a checkin with status == 'Completed'
    completed_goals = db.query(Goal).filter(
        or_(
            Goal.status == "completed",
            Goal.checkins.any(CheckIn.status == "Completed")
        )
    ).distinct().count()

    # Overdue: timeline goals with target in the past that are not completed,
    # or goals of employees with open 'Check-in overdue' escalations
    overdue_timeline = db.query(Goal).filter(
        Goal.uom == "Timeline",
        Goal.target < today_str,
        Goal.status != "completed",
        ~Goal.checkins.any(CheckIn.status == "Completed")
    ).count()

    open_overdue_escs = db.query(Escalation).filter(
        Escalation.status == "open",
        Escalation.type.ilike("%overdue%")
    ).count()

    overdue_goals = overdue_timeline + open_overdue_escs

    return {
        "total_goals": total_goals,
        "completed_goals": completed_goals,
        "overdue_goals": overdue_goals,
        "in_progress_goals": max(0, total_goals - completed_goals),
    }

