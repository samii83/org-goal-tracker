from datetime import datetime, timezone
from fastapi import APIRouter, Response, status
from backend.app.config import settings
from backend.app.database import check_db_connectivity
from backend.app.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
@router.get("/api/health", response_model=HealthResponse)
def get_health_status(response: Response):
    """
    Checks backend service health and database connectivity.
    If database connectivity fails, returns status 'degraded' (HTTP 200 or 503)
    with the exact error message so administrators can diagnose issues immediately.
    """
    is_connected, db_err = check_db_connectivity()

    current_status = "ok" if is_connected else "degraded"
    db_status = "connected" if is_connected else "disconnected"

    # Degraded status still returns informative JSON
    if not is_connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HealthResponse(
        status=current_status,
        database=db_status,
        database_url_configured=bool(settings.sqlalchemy_database_uri),

        error=db_err,
        timestamp=datetime.now(timezone.utc).isoformat(),
        environment=settings.ENVIRONMENT,
    )

