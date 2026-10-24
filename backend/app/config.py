from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "UK Wind Forecasting Analytics API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Elexon BMRS API Settings
    ELEXON_API_KEY: str = Field(default="", description="Elexon BMRS API Key")
    ELEXON_BASE_URL: str = Field(
        default="https://data.elexon.co.uk/bmrs/api/v1",
        description="Elexon Insights API Base URL"
    )
    REQUEST_TIMEOUT_SECONDS: float = 10.0
    
    # Day-Ahead Decision Rules
    # Standard UK Day-Ahead purchasing decision cutoff on D-1 in UTC
    DEFAULT_CUTOFF_HOUR_UTC: int = 17
    DEFAULT_CUTOFF_MINUTE_UTC: int = 0
    
    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    RATE_LIMIT_PER_MINUTE: int = 120
    
    # Cache settings
    CACHE_TTL_SECONDS: int = 300


settings = Settings()
