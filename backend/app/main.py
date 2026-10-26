import logging
import uuid
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.middleware.rate_limit import SlidingWindowRateLimiter
from backend.app.middleware.security import SecurityHeadersMiddleware
from backend.app.routers import forecasts, health

# Configure structured logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("wind_analytics")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Production-ready UK Wind Generation Forecasting Analytics Service. "
        "Provides Day-Ahead forecast vs actual FUELHH evaluation, look-ahead bias prevention, "
        "MAE, RMSE, Bias metrics, and data quality telemetry."
    ),
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None
)

# 1. Security Headers Middleware (OWASP alignment)
app.add_middleware(SecurityHeadersMiddleware)

# 2. Rate Limiting Middleware
app.add_middleware(
    SlidingWindowRateLimiter,
    max_requests=settings.RATE_LIMIT_PER_MINUTE,
    window_seconds=60
)

# 3. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Retry-After"]
)

# 4. Exception Handlers (Sanitized error responses to prevent information disclosure)
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    err_id = str(uuid.uuid4())
    logger.error(f"Unhandled exception [Incident ID: {err_id}]: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please contact system support.",
            "incident_id": err_id
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Defense-in-depth: Sanitize error details to prevent reflection of raw malicious payloads (XSS/injection)
    sanitized_errors = []
    for err in exc.errors():
        field_loc = " -> ".join(str(loc) for loc in err.get("loc", []))
        sanitized_errors.append({
            "field": field_loc,
            "issue": err.get("msg", "Invalid value"),
            "type": err.get("type", "value_error")
        })
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Invalid request parameters.",
            "details": sanitized_errors
        }
    )


# 5. Include API Routers
app.include_router(health.router)
app.include_router(forecasts.router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs" if settings.ENVIRONMENT != "production" else "disabled_in_production",
        "endpoints": {
            "health": "/health",
            "available_dates": "/api/dates",
            "forecast_analysis": "/api/analysis?target_date=2026-01-15",
            "monthly_summary": "/api/summary/monthly?year=2026&month=1"
        }
    }
