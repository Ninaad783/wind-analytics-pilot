from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.config import settings
from backend.app.models import HealthStatus
from backend.app.services.data_store import BenchmarkDataStore

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthStatus)
async def get_health():
    """Health check endpoint for container orchestrators and monitoring."""
    return HealthStatus(
        status="healthy",
        app_name=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
        elexon_upstream_configured=bool(settings.ELEXON_API_KEY)
    )


@router.get("/ready")
async def get_readiness():
    """Readiness probe verifying in-memory data store readiness."""
    dates = BenchmarkDataStore.get_available_dates()
    is_ready = len(dates) > 0
    return {
        "status": "ready" if is_ready else "not_ready",
        "benchmark_dates_loaded": len(dates),
        "timestamp_utc": datetime.now(timezone.utc).isoformat()
    }
