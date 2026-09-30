from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/chemora"
    secret_key: str = "change-this-development-secret"
    access_token_expire_minutes: int = 15
    cors_origins: str = "http://localhost:8080,http://localhost:5173"
    first_superadmin_email: str = "admin@chemora.com"
    first_superadmin_password: str = "Admin@123"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
settings = Settings()
