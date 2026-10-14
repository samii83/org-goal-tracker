import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.database import init_db
from backend.app.routers import health, auth, goals, users, audit, dashboard


# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("goaltrack")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup & shutdown lifespan event handler.
    Attempts to initialize tables on startup. If database is unreachable,
    it logs a clear warning without crashing the service, allowing
    health checks to return accurate status.
    """
    logger.info("Starting Org Goal Tracker API (%s)...", settings.ENVIRONMENT)
    success, msg = init_db()
    if success:
        logger.info("Database initialized successfully.")
    else:
        logger.warning(
            "Database initialization deferred: %s. "
            "Please configure database credentials or verify MySQL connection.", msg
        )
    yield
    logger.info("Shutting down Org Goal Tracker API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack enterprise Goal Tracking backend with MySQL & SQLAlchemy",
    version="1.0.0",
    lifespan=lifespan,
)

# Development CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error": str(exc)},
    )


# Mount routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(goals.router)
app.include_router(audit.router)
app.include_router(dashboard.router)

# Mount built frontend static files if dist exists (production/Docker single-container deploy)
from pathlib import Path
from fastapi.staticfiles import StaticFiles

dist_path = Path(__file__).resolve().parent.parent.parent / "dist"
if dist_path.exists() and (dist_path / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "status": "online",
            "documentation": "/docs",
            "health": "/api/health",
        }


