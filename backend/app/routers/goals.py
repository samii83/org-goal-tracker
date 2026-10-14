from datetime import datetime, timezone
import time
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Goal, CheckIn, Approval, AuditEvent, User
from backend.app.schemas import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    AchievementLogRequest,
    CheckInCommentRequest,
    SharedGoalPushRequest,
)
from backend.app.auth import get_current_user_optional, require_roles

router = APIRouter(prefix="/api/goals", tags=["Goals & Check-ins"])


def format_goal_response(goal: Goal) -> dict[str, Any]:
    """Formats SQLAlchemy Goal model into frontend-compatible dictionary."""
    achievements = {}
    checkins = {}

    for c in goal.checkins:
        if c.actual is not None or c.status is not None:
            achievements[c.quarter] = {
                "actual": float(c.actual) if c.actual and c.actual.replace(".", "", 1).isdigit() else c.actual,
                "status": c.status or "On Track",
                "updatedAt": c.updated_at.strftime("%Y-%m-%d") if c.updated_at else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            }
        if c.comment:
            checkins[c.quarter] = {
                "comment": c.comment,
                "managerName": c.manager_name or "Manager",
                "date": c.reviewed_at.strftime("%Y-%m-%d") if c.reviewed_at else c.updated_at.strftime("%Y-%m-%d"),
            }

    # Format target as number if numeric
    target_val = goal.target
    if target_val and target_val.replace(".", "", 1).isdigit():
        target_val = float(target_val) if "." in target_val else int(target_val)

    return {
        "id": goal.id,
        "employeeId": goal.employee_id,
        "thrustArea": goal.thrust_area,
        "title": goal.title,
        "description": goal.description or "",
        "uom": goal.uom,
        "target": target_val,
        "weightage": goal.weightage,
        "status": goal.status,
        "locked": goal.locked,
        "isShared": goal.is_shared,
        "sharedGroupId": goal.shared_group_id,
        "primaryOwnerId": goal.primary_owner_id,
        "createdAt": goal.created_at.strftime("%Y-%m-%d") if goal.created_at else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "achievements": achievements,
        "checkins": checkins,
    }


def record_audit(
    db: Session,
    action: str,
    user_name: str,
    goal_title: Optional[str] = None,
    goal_id: Optional[int] = None,
    details: Optional[str] = None,
    user_id: Optional[int] = None,
):
    """Utility to record an audit trail entry."""
    entry = AuditEvent(
        action=action,
        user_name=user_name,
        user_id=user_id,
        goal_title=goal_title,
        goal_id=goal_id,
        timestamp=datetime.now(timezone.utc),
        details=details,
    )
    db.add(entry)


@router.get("", response_model=list[GoalResponse])
def list_goals(
    employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieves all goals or filters by employee."""
    query = db.query(Goal)
    if employee_id is not None:
        query = query.filter(Goal.employee_id == employee_id)
    goals = query.order_by(Goal.id).all()
    return [format_goal_response(g) for g in goals]


@router.post("", response_model=GoalResponse)
def create_goal(
    payload: GoalCreate,
    employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Creates a new draft goal for an employee."""
    target_emp_id = employee_id or (current_user.id if current_user else None)
    if not target_emp_id:
        raise HTTPException(status_code=400, detail="Employee ID must be provided or session active.")

    # Check maximum 8 active goals rule
    active_count = db.query(Goal).filter(
        Goal.employee_id == target_emp_id,
        Goal.status != "rejected"
    ).count()
    if active_count >= 8:
        raise HTTPException(status_code=400, detail="Maximum 8 goals allowed per employee.")

    if payload.weightage < 10.0:
        raise HTTPException(status_code=400, detail="Minimum weightage per goal is 10%.")

    new_goal = Goal(
        employee_id=target_emp_id,
        thrust_area=payload.thrustArea,
        title=payload.title,
        description=payload.description or "",
        uom=payload.uom,
        target=str(payload.target),
        weightage=float(payload.weightage),
        status="draft",
        locked=False,
        is_shared=False,
    )
    db.add(new_goal)
    db.flush()

    user_name = current_user.name if current_user else f"Employee #{target_emp_id}"
    record_audit(
        db=db,
        action="Goal created",
        user_name=user_name,
        user_id=current_user.id if current_user else target_emp_id,
        goal_title=payload.title,
        goal_id=new_goal.id,
        details="Draft created",
    )
    db.commit()
    db.refresh(new_goal)
    return format_goal_response(new_goal)


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Updates an existing goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    if goal.locked and not (current_user and current_user.role in ("manager", "admin")):
        raise HTTPException(status_code=403, detail="Goal is locked and cannot be edited.")

    if payload.thrustArea is not None and not goal.is_shared:
        goal.thrust_area = payload.thrustArea
    if payload.title is not None and not goal.is_shared:
        goal.title = payload.title
    if payload.description is not None and not goal.is_shared:
        goal.description = payload.description
    if payload.uom is not None and not goal.is_shared:
        goal.uom = payload.uom
    if payload.target is not None and not goal.is_shared:
        goal.target = str(payload.target)
    if payload.weightage is not None:
        goal.weightage = float(payload.weightage)
    if payload.status is not None:
        goal.status = payload.status
    if payload.locked is not None and current_user and current_user.role == "admin":
        goal.locked = payload.locked

    user_name = current_user.name if current_user else "User"
    record_audit(
        db=db,
        action="Goal edited",
        user_name=user_name,
        user_id=current_user.id if current_user else None,
        goal_title=goal.title,
        goal_id=goal.id,
        details="Updated goal parameters",
    )
    db.commit()
    db.refresh(goal)
    return format_goal_response(goal)


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Deletes an unapproved draft or returned goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    if goal.locked:
        raise HTTPException(status_code=400, detail="Cannot delete a locked goal.")

    title = goal.title
    db.delete(goal)
    user_name = current_user.name if current_user else "User"
    record_audit(
        db=db,
        action="Goal deleted",
        user_name=user_name,
        user_id=current_user.id if current_user else None,
        goal_title=title,
        goal_id=goal_id,
        details=f"Deleted goal #{goal_id}",
    )
    db.commit()
    return {"message": f"Goal '{title}' deleted successfully."}


@router.post("/submit")
def submit_draft_goals(
    employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Submits draft goals for approval after verifying total weightage equals exactly 100%."""
    target_emp_id = employee_id or (current_user.id if current_user else None)
    if not target_emp_id:
        raise HTTPException(status_code=400, detail="Employee ID must be provided.")

    active_goals = db.query(Goal).filter(
        Goal.employee_id == target_emp_id,
        Goal.status != "rejected"
    ).all()

    total_weightage = sum(g.weightage for g in active_goals)
    if round(total_weightage, 2) != 100.0:
        raise HTTPException(
            status_code=400,
            detail=f"Total weightage must equal 100%. Currently: {total_weightage}%",
        )

    drafts = [g for g in active_goals if g.status == "draft"]
    if not drafts:
        raise HTTPException(status_code=400, detail="No draft goals to submit.")

    for g in drafts:
        g.status = "pending"

    user_name = current_user.name if current_user else f"Employee #{target_emp_id}"
    record_audit(
        db=db,
        action="Goals submitted for approval",
        user_name=user_name,
        user_id=current_user.id if current_user else target_emp_id,
        goal_title="(All drafts)",
        details=f"{len(drafts)} goals submitted for approval",
    )
    db.commit()
    return {"message": f"Successfully submitted {len(drafts)} goal(s) for manager approval."}


@router.post("/{goal_id}/approve", response_model=GoalResponse)
def approve_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Approves and locks a goal (Manager/Admin)."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    goal.status = "approved"
    goal.locked = True

    reviewer_id = current_user.id if current_user else 2
    reviewer_name = current_user.name if current_user else "Manager"

    db.add(Approval(
        goal_id=goal.id,
        reviewer_id=reviewer_id,
        action="approved",
        comments="Approved and locked",
        previous_status="pending",
        new_status="approved",
    ))
    record_audit(
        db=db,
        action="Goal approved",
        user_name=reviewer_name,
        user_id=reviewer_id,
        goal_title=goal.title,
        goal_id=goal.id,
        details="Approved and locked",
    )
    db.commit()
    db.refresh(goal)
    return format_goal_response(goal)


@router.post("/{goal_id}/reject", response_model=GoalResponse)
def reject_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Returns goal to employee for rework."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    goal.status = "rejected"
    goal.locked = False

    reviewer_id = current_user.id if current_user else 2
    reviewer_name = current_user.name if current_user else "Manager"

    db.add(Approval(
        goal_id=goal.id,
        reviewer_id=reviewer_id,
        action="rejected",
        comments="Returned to employee for rework",
        previous_status=goal.status,
        new_status="rejected",
    ))
    record_audit(
        db=db,
        action="Goal returned for rework",
        user_name=reviewer_name,
        user_id=reviewer_id,
        goal_title=goal.title,
        goal_id=goal.id,
        details="Returned to employee",
    )
    db.commit()
    db.refresh(goal)
    return format_goal_response(goal)


@router.post("/{goal_id}/achievement", response_model=GoalResponse)
def log_achievement(
    goal_id: int,
    payload: AchievementLogRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Logs quarterly achievement for a goal. If shared KPI, updates team group."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    goals_to_update = [goal]
    if goal.is_shared and goal.shared_group_id and current_user and goal.primary_owner_id == current_user.id:
        shared_peers = db.query(Goal).filter(
            Goal.shared_group_id == goal.shared_group_id,
            Goal.id != goal.id
        ).all()
        goals_to_update.extend(shared_peers)

    for g in goals_to_update:
        ci = db.query(CheckIn).filter(
            CheckIn.goal_id == g.id,
            CheckIn.quarter == payload.quarter
        ).first()
        if not ci:
            ci = CheckIn(
                goal_id=g.id,
                quarter=payload.quarter,
                actual=str(payload.actual),
                status=payload.status or "On Track",
            )
            db.add(ci)
        else:
            ci.actual = str(payload.actual)
            ci.status = payload.status or ci.status
            ci.updated_at = datetime.now(timezone.utc)

    user_name = current_user.name if current_user else "Employee"
    record_audit(
        db=db,
        action="Achievement logged",
        user_name=user_name,
        user_id=current_user.id if current_user else None,
        goal_title=goal.title,
        goal_id=goal.id,
        details=f"{payload.quarter}: actual={payload.actual}",
    )
    db.commit()
    db.refresh(goal)
    return format_goal_response(goal)


@router.post("/{goal_id}/checkin", response_model=GoalResponse)
def add_checkin_comment(
    goal_id: int,
    payload: CheckInCommentRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Adds manager check-in feedback comment to a quarterly goal."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    manager_name = current_user.name if current_user else "Manager"
    manager_id = current_user.id if current_user else None

    ci = db.query(CheckIn).filter(
        CheckIn.goal_id == goal.id,
        CheckIn.quarter == payload.quarter
    ).first()

    if not ci:
        ci = CheckIn(
            goal_id=goal.id,
            quarter=payload.quarter,
            comment=payload.comment,
            manager_name=manager_name,
            reviewed_by_id=manager_id,
            reviewed_at=datetime.now(timezone.utc),
        )
        db.add(ci)
    else:
        ci.comment = payload.comment
        ci.manager_name = manager_name
        ci.reviewed_by_id = manager_id
        ci.reviewed_at = datetime.now(timezone.utc)

    record_audit(
        db=db,
        action="Check-in completed",
        user_name=manager_name,
        user_id=manager_id,
        goal_title=goal.title,
        goal_id=goal.id,
        details=f"{payload.quarter} check-in saved",
    )
    db.commit()
    db.refresh(goal)
    return format_goal_response(goal)


@router.post("/shared")
def push_shared_goals(
    payload: SharedGoalPushRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Pushes a shared departmental goal to all employees in the department (Admin)."""
    recipients = db.query(User).filter(
        User.role == "employee",
        User.dept == payload.dept
    ).all()

    if not recipients:
        raise HTTPException(status_code=400, detail=f"No employees found in department '{payload.dept}'.")

    group_id = f"sg_{int(time.time())}"
    primary_owner_id = recipients[0].id

    created_goals = []
    for emp in recipients:
        g = Goal(
            employee_id=emp.id,
            thrust_area=payload.thrust,
            title=payload.title,
            description=payload.desc or "",
            uom=payload.uom,
            target=str(payload.target),
            weightage=0.0,
            status="approved",
            locked=True,
            is_shared=True,
            shared_group_id=group_id,
            primary_owner_id=primary_owner_id,
        )
        db.add(g)
        created_goals.append(g)

    user_name = current_user.name if current_user else "Admin HR"
    record_audit(
        db=db,
        action="Shared goal pushed",
        user_name=user_name,
        user_id=current_user.id if current_user else None,
        goal_title=payload.title,
        details=f"Pushed to {len(recipients)} employees in {payload.dept}",
    )
    db.commit()
    return {"message": f"Shared goal successfully pushed to {len(recipients)} employees in {payload.dept}."}


@router.post("/{goal_id}/unlock", response_model=GoalResponse)
def unlock_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Admin override to unlock an approved goal for editing."""
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")

    goal.locked = False
    admin_name = current_user.name if current_user else "Admin HR"

    record_audit(
        db=db,
        action="Goal unlocked (Admin override)",
        user_name=admin_name,
        user_id=current_user.id if current_user else None,
        goal_title=goal.title,
        goal_id=goal.id,
        details="Admin unlocked for editing",
    )
    db.commit()
    db.refresh(goal)
    return format_goal_response(goal)

