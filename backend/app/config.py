import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in project root or current working directory
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    PROJECT_NAME: str = "Org Goal Tracker API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database Configuration: SQLite by default; MySQL or other DBMS when DATABASE_URL is specified
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    @property
    def sqlalchemy_database_uri(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # Default persistent SQLite database
        db_file = root_dir / "goaltrack.db"
        return f"sqlite:///{db_file.as_posix()}"


    # Security & Session Cookies
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production_32bytes_required")
    SESSION_COOKIE_NAME: str = os.getenv("SESSION_COOKIE_NAME", "goaltrack_session")
    SESSION_MAX_AGE_SECONDS: int = int(os.getenv("SESSION_MAX_AGE_SECONDS", "86400"))  # 24 hours
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() in ("true", "1", "yes")
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    # CORS Configuration
    CORS_ORIGINS_RAW: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS_RAW.split(",") if o.strip()]


settings = Settings()

