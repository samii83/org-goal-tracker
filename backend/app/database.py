import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy Base model
Base = declarative_base()

# Configure engine based on URI
db_uri = settings.sqlalchemy_database_uri
is_sqlite = db_uri.startswith("sqlite")

engine_kwargs = {
    "pool_pre_ping": True,
}

if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_recycle"] = 3600
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(db_uri, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connectivity() -> tuple[bool, str | None]:
    """
    Performs a live connectivity test to the configured database.
    Returns (True, None) if successful, or (False, error_message).
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, None
    except Exception as e:
        logger.warning("Database connectivity check failed: %s", str(e))
        return False, str(e)


def init_db():
    """
    Creates database tables and seeds initial data if tables are empty.
    Returns (success, message).
    """
    connected, err = check_db_connectivity()
    if not connected:
        logger.error("Cannot initialize database: connection failed (%s)", err)
        return False, f"Database unreachable: {err}"

    try:
        # Import models so all tables are registered with Base.metadata
        from backend.app import models  # noqa: F401
        Base.metadata.create_all(bind=engine)

        # Run initial seeder
        from backend.app.seed import seed_initial_data
        with SessionLocal() as session:
            seed_initial_data(session)

        return True, "Database tables verified and initialized successfully."
    except Exception as e:
        logger.error("Error creating tables or seeding database: %s", str(e))
        return False, str(e)

