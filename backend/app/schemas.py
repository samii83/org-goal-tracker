from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


# ============ AUTH & USER SCHEMAS ============
class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = ""



class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str  # "employee", "manager", "admin"
    dept: str
    manager_id: Optional[int] = None
    team_id: Optional[int] = None

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ============ GOAL & CHECKIN SCHEMAS ============
class GoalCreate(BaseModel):
    thrustArea: str = Field(..., alias="thrustArea")
    title: str
    description: Optional[str] = ""
    uom: str
    target: Any  # number or date string
    weightage: float = Field(..., ge=10, le=100)

    class Config:
        populate_by_name = True


class GoalUpdate(BaseModel):
    thrustArea: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    uom: Optional[str] = None
    target: Optional[Any] = None
    weightage: Optional[float] = None
    status: Optional[str] = None
    locked: Optional[bool] = None

    class Config:
        populate_by_name = True


class AchievementLogRequest(BaseModel):
    quarter: str
    actual: Any
    status: Optional[str] = "On Track"


class CheckInCommentRequest(BaseModel):
    quarter: str
    comment: str


class SharedGoalPushRequest(BaseModel):
    dept: str
    thrust: str
    title: str
    desc: Optional[str] = ""
    uom: str
    target: Any


class GoalResponse(BaseModel):
    id: int
    employeeId: int
    thrustArea: str
    title: str
    description: Optional[str] = ""
    uom: str
    target: Any
    weightage: float
    status: str
    locked: bool
    isShared: bool
    sharedGroupId: Optional[str] = None
    primaryOwnerId: Optional[int] = None
    createdAt: str
    achievements: dict[str, Any] = {}
    checkins: dict[str, Any] = {}

    class Config:
        populate_by_name = True


# ============ AUDIT & ESCALATION SCHEMAS ============
class AuditResponse(BaseModel):
    id: int
    action: str
    user: str
    goalTitle: Optional[str] = None
    timestamp: str
    details: Optional[str] = None


class EscalationResponse(BaseModel):
    id: int
    type: str
    employeeId: int
    employeeName: str
    managerId: Optional[int] = None
    managerName: Optional[str] = None
    triggeredAt: str
    status: str
    resolvedAt: Optional[str] = None
    note: Optional[str] = None


# ============ HEALTH & SYSTEM SCHEMAS ============
class HealthResponse(BaseModel):
    status: str
    database: str
    database_url_configured: bool
    error: Optional[str] = None
    timestamp: str
    environment: str
