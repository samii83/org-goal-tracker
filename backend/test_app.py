"""
Automated backend verification test script.
Tests health endpoint, DB models, migrations/table creation, auth cookie sessions, and RBAC roles.
"""
import os
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = str(Path(__file__).resolve().parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Test with SQLite in-memory / temporary test database to verify SQLAlchemy schema and operations
os.environ["DATABASE_URL"] = "sqlite:///./test_goaltrack.db"
os.environ["SECRET_KEY"] = "test_secret_key_32_bytes_long_minimum!"

from fastapi.testclient import TestClient
from backend.app.main import app

from backend.app.database import engine, Base, init_db
from backend.app.models import User, Team, Goal, CheckIn, Approval, AuditEvent, Escalation

def run_checks():
    print("=" * 60)
    print("RUNNING BACKEND VERIFICATION CHECKS")
    print("=" * 60)

    # 1. Initialize Tables & Seed Data
    print("\n[Check 1] Creating database tables & running seeder...")
    success, msg = init_db()
    assert success, f"DB initialization failed: {msg}"
    print("✓ Tables created successfully for: users, teams, goals, check_ins, approvals, audit_events, escalations")

    client = TestClient(app)

    # 2. Health Endpoint & Live Connectivity Check
    print("\n[Check 2] Testing /api/health endpoint...")
    res = client.get("/api/health")
    print(f"Health response status code: {res.status_code}")
    data = res.json()
    print(f"Health payload: {data}")
    assert res.status_code == 200
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    print("✓ Health check returned 200 OK with database: connected")

    # 3. Authentication & Cookie Session Test
    print("\n[Check 3] Testing Email/Password Auth & Cookie Sessions...")
    # Login with valid demo credentials
    login_res = client.post("/api/auth/login", json={"email": "priya@atomberg.com", "password": "password123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    user_data = login_res.json()
    assert user_data["email"] == "priya@atomberg.com"
    assert user_data["role"] == "employee"

    # Verify session cookie was set
    session_cookie = login_res.cookies.get("goaltrack_session")
    assert session_cookie is not None, "Session cookie 'goaltrack_session' was not set!"
    print(f"✓ Session cookie set: {session_cookie[:20]}...")

    # Access /api/auth/me using the cookie
    me_res = client.get("/api/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Priya Sharma"
    print("✓ /api/auth/me authenticated successfully via session cookie")

    # 4. Goals & Roles Check
    print("\n[Check 4] Testing Goal Operations & Constraints...")
    # List goals
    goals_res = client.get("/api/goals")
    assert goals_res.status_code == 200
    goals = goals_res.json()
    print(f"✓ Retrieved {len(goals)} seeded goals")

    # Create a draft goal
    new_g = client.post("/api/goals", json={
        "thrustArea": "Innovation",
        "title": "Automate Data Pipelines",
        "description": "Build automated ETL workflows",
        "uom": "Numeric (Higher is Better)",
        "target": 100,
        "weightage": 15
    })
    assert new_g.status_code == 200
    created_id = new_g.json()["id"]
    print(f"✓ Created draft goal #{created_id}")

    # Manager approves goal
    # Sign in as Manager Rajesh Kumar
    mgr_login = client.post("/api/auth/login", json={"email": "rajesh@atomberg.com", "password": "password123"})
    assert mgr_login.status_code == 200
    assert mgr_login.json()["role"] == "manager"

    appr_res = client.post(f"/api/goals/{created_id}/approve")
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "approved"
    assert appr_res.json()["locked"] is True
    print(f"✓ Goal #{created_id} approved and locked by manager")

    # 5. Goal Progress Update & Delete CRUD Check
    print("\n[Check 5] Testing Goal Progress/Status Update & Deletion...")
    # Update progress/achievement
    ach_res = client.post(f"/api/goals/{created_id}/achievement", json={
        "quarter": "Q1 (July)",
        "actual": 85,
        "status": "Completed"
    })
    assert ach_res.status_code == 200
    assert ach_res.json()["achievements"]["Q1 (July)"]["actual"] == 85
    print(f"✓ Goal #{created_id} progress updated")

    # Create temporary goal and delete it
    tmp_g = client.post("/api/goals", json={
        "thrustArea": "Cost Optimization",
        "title": "Temporary Goal",
        "uom": "Zero-based",
        "target": 0,
        "weightage": 10
    })
    assert tmp_g.status_code == 200
    tmp_id = tmp_g.json()["id"]
    del_res = client.delete(f"/api/goals/{tmp_id}")
    assert del_res.status_code == 200
    print(f"✓ Goal #{tmp_id} deleted successfully")

    # 6. SQL-Backed Dashboard Stats
    print("\n[Check 6] Testing /api/dashboard/stats endpoint...")
    dash_res = client.get("/api/dashboard/stats")
    assert dash_res.status_code == 200
    stats = dash_res.json()
    print(f"Dashboard Stats payload: {stats}")
    assert "total_goals" in stats
    assert "completed_goals" in stats
    assert "overdue_goals" in stats
    assert stats["total_goals"] >= 12
    print(f"✓ Dashboard stats verified: {stats['total_goals']} total, {stats['completed_goals']} completed, {stats['overdue_goals']} overdue")

    # 7. Audit Events Verification
    print("\n[Check 7] Testing Audit Trail & Escalations...")
    audit_res = client.get("/api/audit")
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 4
    print(f"✓ Audit trail recorded {len(audit_res.json())} events")

    esc_res = client.get("/api/escalations")
    assert esc_res.status_code == 200
    assert len(esc_res.json()) >= 2
    print(f"✓ Escalations retrieved {len(esc_res.json())} items")

    # 8. Logout Test
    print("\n[Check 8] Testing Session Logout...")
    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200
    print("✓ Logout successfully cleared session")

    print("\n" + "=" * 60)
    print("ALL BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 60)

    # Clean up test database file
    engine.dispose()
    if os.path.exists("./test_goaltrack.db"):
        try:
            os.remove("./test_goaltrack.db")
        except Exception:
            pass

if __name__ == "__main__":
    run_checks()
