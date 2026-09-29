from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "NeoCRM API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql://neocrm:neocrm_dev@localhost:5432/neocrm"

    # Security
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # CORS — frontend origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "http://localhost:80",
    ]

    # First superadmin (seeded on startup if no users exist)
    FIRST_SUPERADMIN_EMAIL: str = "admin@neocrm.local"
    FIRST_SUPERADMIN_PASSWORD: str = "changeme123"
    FIRST_ORG_NAME: str = "NeoCRM"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
