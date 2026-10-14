from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    users = relationship("User", back_populates="team")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="employee")  # "employee", "manager", "admin"
    dept = Column(String(100), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Self-referential relationship for manager -> reports
    team = relationship("Team", back_populates="users")
    manager = relationship("User", remote_side=[id], backref="reports")
    goals = relationship("Goal", back_populates="employee", foreign_keys="Goal.employee_id", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="user")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    thrust_area = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    uom = Column(String(100), nullable=False)  # "Numeric (Higher is Better)", "Numeric (Lower is Better)", "Timeline", "Zero-based"
    target = Column(String(100), nullable=False)
    weightage = Column(Float, nullable=False, default=10.0)
    status = Column(String(50), nullable=False, default="draft", index=True)  # "draft", "pending", "approved", "rejected"
    locked = Column(Boolean, default=False, nullable=False)
    is_shared = Column(Boolean, default=False, nullable=False)
    shared_group_id = Column(String(100), nullable=True, index=True)
    primary_owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    employee = relationship("User", foreign_keys=[employee_id], back_populates="goals")
    primary_owner = relationship("User", foreign_keys=[primary_owner_id])
    checkins = relationship("CheckIn", back_populates="goal", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="goal", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_goal_employee_status", "employee_id", "status"),
    )


class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    quarter = Column(String(50), nullable=False)  # e.g. "Q1 (July)", "Q2 (October)", etc.
    actual = Column(String(100), nullable=True)
    status = Column(String(50), nullable=True)  # "Not Started", "On Track", "Completed"
    comment = Column(Text, nullable=True)
    manager_name = Column(String(120), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    goal = relationship("Goal", back_populates="checkins")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])

    __table_args__ = (
        Index("idx_checkin_goal_quarter", "goal_id", "quarter", unique=True),
    )


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(50), nullable=False)  # "approved", "rejected", "edited", "unlocked"
    comments = Column(Text, nullable=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    goal = relationship("Goal", back_populates="approvals")
    reviewer = relationship("User", foreign_keys=[reviewer_id])


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action = Column(String(120), nullable=False)
    user_name = Column(String(120), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    goal_title = Column(String(255), nullable=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False, index=True)
    details = Column(Text, nullable=True)

    user = relationship("User", back_populates="audit_events")


class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type = Column(String(100), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    employee_name = Column(String(120), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    manager_name = Column(String(120), nullable=True)
    triggered_at = Column(DateTime, default=utc_now, nullable=False)
    status = Column(String(50), default="open", nullable=False)  # "open", "resolved"
    resolved_at = Column(DateTime, nullable=True)
    note = Column(Text, nullable=True)

