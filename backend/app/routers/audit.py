from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import AuditEvent, Escalation
from backend.app.schemas import AuditResponse, EscalationResponse

router = APIRouter(prefix="/api", tags=["Audit & Governance"])


@router.get("/audit", response_model=list[AuditResponse])
def get_audit_trail(db: Session = Depends(get_db)):
    """Returns chronological audit trail for governance, changes, and reviews."""
    events = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).all()
    return [
        {
            "id": e.id,
            "action": e.action,
            "user": e.user_name,
            "goalTitle": e.goal_title,
            "timestamp": e.timestamp.strftime("%Y-%m-%d %H:%M") if e.timestamp else "",
            "details": e.details or "",
        }
        for e in events
    ]


@router.get("/escalations", response_model=list[EscalationResponse])
def get_escalations(db: Session = Depends(get_db)):
    """Returns system escalations (missed submissions, overdue check-ins)."""
    escs = db.query(Escalation).order_by(Escalation.triggered_at.desc()).all()
    return [
        {
            "id": e.id,
            "type": e.type,
            "employeeId": e.employee_id,
            "employeeName": e.employee_name,
            "managerId": e.manager_id,
            "managerName": e.manager_name,
            "triggeredAt": e.triggered_at.strftime("%Y-%m-%d") if e.triggered_at else "",
            "status": e.status,
            "resolvedAt": e.resolved_at.strftime("%Y-%m-%d") if e.resolved_at else None,
            "note": e.note or "",
        }
        for e in escs
    ]


@router.post("/escalations/{escalation_id}/resolve", response_model=EscalationResponse)
def resolve_escalation(escalation_id: int, db: Session = Depends(get_db)):
    """Marks an escalation item as resolved."""
    esc = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found.")

    esc.status = "resolved"
    esc.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(esc)

    return {
        "id": esc.id,
        "type": esc.type,
        "employeeId": esc.employee_id,
        "employeeName": esc.employee_name,
        "managerId": esc.manager_id,
        "managerName": esc.manager_name,
        "triggeredAt": esc.triggered_at.strftime("%Y-%m-%d") if esc.triggered_at else "",
        "status": esc.status,
        "resolvedAt": esc.resolved_at.strftime("%Y-%m-%d") if esc.resolved_at else None,
        "note": esc.note or "",
    }

