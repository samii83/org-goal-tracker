from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models import Team, User, Goal, CheckIn, Approval, AuditEvent, Escalation
from backend.app.auth import hash_password


def seed_initial_data(db: Session):
    """Populates database with initial demo data if users table is empty."""
    if db.query(User).first() is not None:
        return  # Already seeded

    # 1. Teams
    teams = {
        "Sales": Team(name="Sales", description="Sales and Business Development"),
        "Operations": Team(name="Operations", description="Manufacturing and Supply Chain Operations"),
        "HR": Team(name="HR", description="Human Resources and People Operations"),
    }
    for t in teams.values():
        db.add(t)
    db.flush()

    # 2. Users (all seeded with default password 'password123')
    default_pw_hash = hash_password("password123")

    users_data = [
        # (id, name, email, role, dept, manager_id, team)
        (1, "Priya Sharma", "priya@atomberg.com", "employee", "Sales", 2, teams["Sales"]),
        (2, "Rajesh Kumar", "rajesh@atomberg.com", "manager", "Sales", 3, teams["Sales"]),
        (3, "Admin HR", "admin@atomberg.com", "admin", "HR", None, teams["HR"]),
        (4, "Anita Singh", "anita@atomberg.com", "employee", "Sales", 2, teams["Sales"]),
        (5, "Vikram Nair", "vikram@atomberg.com", "employee", "Operations", 2, teams["Operations"]),
    ]

    user_objs = {}
    for uid, name, email, role, dept, mgr_id, team in users_data:
        u = User(
            id=uid,
            name=name,
            email=email,
            hashed_password=default_pw_hash,
            role=role,
            dept=dept,
            manager_id=mgr_id,
            team_id=team.id,
            created_at=datetime.fromisoformat("2026-05-01T09:00:00"),
        )
        db.add(u)
        user_objs[uid] = u
    db.flush()

    # 3. Goals
    goals_data = [
        {
            "id": 1, "employee_id": 1, "thrust_area": "Revenue Growth", "title": "Achieve Sales Target",
            "description": "Hit Rs 50L quarterly sales revenue", "uom": "Numeric (Higher is Better)",
            "target": "5000000", "weightage": 40.0, "status": "approved", "locked": True, "is_shared": False,
            "created_at": datetime.fromisoformat("2026-05-01T10:00:00"),
            "checkins": [
                {"quarter": "Q1 (July)", "actual": "3200000", "status": "On Track", "comment": "Good momentum, keep pushing!", "manager_name": "Rajesh Kumar"}
            ]
        },
        {
            "id": 2, "employee_id": 1, "thrust_area": "Customer Success", "title": "Improve CSAT Score",
            "description": "Customer satisfaction above 4.5/5", "uom": "Numeric (Higher is Better)",
            "target": "4.5", "weightage": 30.0, "status": "approved", "locked": True, "is_shared": False,
            "created_at": datetime.fromisoformat("2026-05-01T10:05:00"),
            "checkins": []
        },
        {
            "id": 3, "employee_id": 1, "thrust_area": "Operational Excellence", "title": "Reduce TAT",
            "description": "Turnaround time below 2 days", "uom": "Numeric (Lower is Better)",
            "target": "2", "weightage": 20.0, "status": "approved", "locked": True, "is_shared": False,
            "created_at": datetime.fromisoformat("2026-05-01T10:10:00"),
            "checkins": []
        },
        {
            "id": 4, "employee_id": 1, "thrust_area": "People & Culture", "title": "Training Completion",
            "description": "Finish all mandatory training by Sep", "uom": "Timeline",
            "target": "2026-09-30", "weightage": 10.0, "status": "approved", "locked": True, "is_shared": False,
            "created_at": datetime.fromisoformat("2026-05-01T10:15:00"),
            "checkins": []
        },
        {
            "id": 5, "employee_id": 4, "thrust_area": "Revenue Growth", "title": "Lead Generation",
            "description": "100 qualified leads per quarter", "uom": "Numeric (Higher is Better)",
            "target": "100", "weightage": 60.0, "status": "pending", "locked": False, "is_shared": False,
            "created_at": datetime.fromisoformat("2026-05-02T11:00:00"),
            "checkins": []
        },
        {
            "id": 6, "employee_id": 4, "thrust_area": "Cost Optimization", "title": "Reduce Travel Expenses",
            "description": "Keep travel under Rs 50K budget", "uom": "Numeric (Lower is Better)",
            "target": "50000", "weightage": 40.0, "status": "pending", "locked": False, "is_shared": False,
            "created_at": datetime.fromisoformat("2026-05-02T11:15:00"),
            "checkins": []
        },
        {
            "id": 7, "employee_id": 5, "thrust_area": "Operational Excellence", "title": "Process Efficiency",
            "description": "Reduce process time by 20%", "uom": "Numeric (Higher is Better)",
            "target": "20", "weightage": 50.0, "status": "approved", "locked": True, "is_shared": False,
            "created_at": datetime.fromisoformat("2026-05-01T12:00:00"),
            "checkins": [
                {"quarter": "Q1 (July)", "actual": "14", "status": "On Track", "comment": None, "manager_name": None}
            ]
        },
        {
            "id": 8, "employee_id": 5, "thrust_area": "Cost Optimization", "title": "Safety Incidents Zero",
            "description": "Zero safety incidents in plant", "uom": "Zero-based",
            "target": "0", "weightage": 30.0, "status": "approved", "locked": True, "is_shared": False,
            "created_at": datetime.fromisoformat("2026-05-01T12:05:00"),
            "checkins": [
                {"quarter": "Q1 (July)", "actual": "0", "status": "Completed", "comment": None, "manager_name": None}
            ]
        },
        {
            "id": 9, "employee_id": 5, "thrust_area": "People & Culture", "title": "Team Training Hours",
            "description": "Complete 40 hrs of team training", "uom": "Numeric (Higher is Better)",
            "target": "40", "weightage": 20.0, "status": "approved", "locked": True, "is_shared": False,
            "created_at": datetime.fromisoformat("2026-05-01T12:10:00"),
            "checkins": []
        },
        {
            "id": 10, "employee_id": 1, "thrust_area": "Revenue Growth", "title": "Q2 Sales Blitz KPI",
            "description": "Dept-wide Q2 sales push target", "uom": "Numeric (Higher is Better)",
            "target": "8000000", "weightage": 0.0, "status": "approved", "locked": True, "is_shared": True,
            "shared_group_id": "sg1", "primary_owner_id": 1,
            "created_at": datetime.fromisoformat("2026-05-05T11:00:00"),
            "checkins": []
        },
        {
            "id": 11, "employee_id": 4, "thrust_area": "Revenue Growth", "title": "Q2 Sales Blitz KPI",
            "description": "Dept-wide Q2 sales push target", "uom": "Numeric (Higher is Better)",
            "target": "8000000", "weightage": 0.0, "status": "approved", "locked": True, "is_shared": True,
            "shared_group_id": "sg1", "primary_owner_id": 1,
            "created_at": datetime.fromisoformat("2026-05-05T11:00:00"),
            "checkins": []
        },
    ]

    for gd in goals_data:
        g = Goal(
            id=gd["id"],
            employee_id=gd["employee_id"],
            thrust_area=gd["thrust_area"],
            title=gd["title"],
            description=gd["description"],
            uom=gd["uom"],
            target=gd["target"],
            weightage=gd["weightage"],
            status=gd["status"],
            locked=gd["locked"],
            is_shared=gd["is_shared"],
            shared_group_id=gd.get("shared_group_id"),
            primary_owner_id=gd.get("primary_owner_id"),
            created_at=gd["created_at"],
            updated_at=gd["created_at"],
        )
        db.add(g)
        db.flush()

        for ci in gd.get("checkins", []):
            c_obj = CheckIn(
                goal_id=g.id,
                quarter=ci["quarter"],
                actual=ci.get("actual"),
                status=ci.get("status"),
                comment=ci.get("comment"),
                manager_name=ci.get("manager_name"),
                reviewed_at=datetime.fromisoformat("2026-07-12T14:00:00") if ci.get("comment") else None,
            )
            db.add(c_obj)

        if gd["status"] == "approved":
            db.add(Approval(
                goal_id=g.id,
                reviewer_id=2,  # Rajesh Kumar
                action="approved",
                comments="Approved and locked",
                previous_status="pending",
                new_status="approved",
                created_at=datetime.fromisoformat("2026-05-03T10:23:00"),
            ))

    # 4. Audit events
    audit_events_data = [
        (1, "Goal approved", "Rajesh Kumar", 2, "Achieve Sales Target", 1, datetime.fromisoformat("2026-05-03T10:23:00"), "Approved and locked"),
        (2, "Achievement logged", "Priya Sharma", 1, "Achieve Sales Target", 1, datetime.fromisoformat("2026-07-10T14:05:00"), "Q1 actual: 3,200,000"),
        (3, "Goal approved", "Rajesh Kumar", 2, "Process Efficiency", 7, datetime.fromisoformat("2026-05-04T09:10:00"), "Approved and locked"),
        (4, "Shared goal pushed", "Admin HR", 3, "Q2 Sales Blitz KPI", 10, datetime.fromisoformat("2026-05-05T11:00:00"), "Pushed to 2 Sales employees"),
    ]
    for aid, action, uname, uid, gtitle, gid, dt, details in audit_events_data:
        db.add(AuditEvent(
            id=aid,
            action=action,
            user_name=uname,
            user_id=uid,
            goal_title=gtitle,
            goal_id=gid,
            timestamp=dt,
            details=details,
        ))

    # 5. Escalations
    escs = [
        Escalation(
            id=1,
            type="Goal not submitted",
            employee_id=5,
            employee_name="Vikram Nair",
            manager_id=2,
            manager_name="Rajesh Kumar",
            triggered_at=datetime.fromisoformat("2026-05-08T00:00:00"),
            status="resolved",
            resolved_at=datetime.fromisoformat("2026-05-09T00:00:00"),
            note="Goals submitted after reminder",
        ),
        Escalation(
            id=2,
            type="Check-in overdue",
            employee_id=5,
            employee_name="Vikram Nair",
            manager_id=2,
            manager_name="Rajesh Kumar",
            triggered_at=datetime.fromisoformat("2026-07-18T00:00:00"),
            status="open",
            resolved_at=None,
            note="",
        ),
    ]
    for e in escs:
        db.add(e)

    db.commit()

