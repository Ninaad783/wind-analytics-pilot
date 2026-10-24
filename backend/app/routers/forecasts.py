from datetime import date, datetime, timezone
import re
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.app.config import settings
from backend.app.models import (
    AvailableDatesResponse,
    ForecastAnalysisResponse,
    ForecastAccuracyMetrics,
)
from backend.app.services.data_store import BenchmarkDataStore
from backend.app.services.elexon_client import ElexonClient
from backend.app.services.forecast_service import ForecastService
from backend.app.services.metrics_service import MetricsService

router = APIRouter(prefix="/api", tags=["Forecasts & Analytics"])
elexon_client = ElexonClient()

COMMERCIAL_GUIDANCE = (
    "Note on Commercial Balancing vs. Forecast Accuracy: "
    "Forecast error (MAE/RMSE/Bias in MW) quantifies the physical generation difference. "
    "In the UK Balancing Mechanism, commercial cashout exposure is determined by multiplying net energy "
    "deviations (MWh) by half-hourly System Buy Price (SBP) or System Sell Price (SSP). "
    "A positive bias indicates persistent over-contracting, risking cashout penalties when SSP is low or negative."
)


@router.get("/dates", response_model=AvailableDatesResponse)
async def get_available_dates():
    """Returns available delivery dates for selection, highlighting January 2026."""
    dates = BenchmarkDataStore.get_available_dates()
    default_d = "2026-01-15" if "2026-01-15" in dates else (dates[0] if dates else "2026-01-01")
    return AvailableDatesResponse(
        available_dates=dates,
        default_date=default_d,
        benchmark_period_description="Full January 2026 high-resolution dataset (1,488 half-hour settlement periods)"
    )


@router.get("/analysis", response_model=ForecastAnalysisResponse)
async def get_forecast_analysis(
    target_date: str = Query(
        ...,
        description="Delivery date (YYYY-MM-DD)",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    ),
    cutoff_hour: int = Query(
        settings.DEFAULT_CUTOFF_HOUR_UTC,
        ge=0,
        le=23,
        description="Day-Ahead purchasing decision cutoff hour (UTC) on D-1"
    ),
    cutoff_minute: int = Query(
        settings.DEFAULT_CUTOFF_MINUTE_UTC,
        ge=0,
        le=59,
        description="Day-Ahead purchasing decision cutoff minute (UTC) on D-1"
    )
):
    """
    Evaluates Day-Ahead wind generation forecast accuracy against actual FUELHH generation.
    Enforces strict Day-Ahead cutoff boundary: never evaluates forecasts published after
    the decision cutoff (prevents look-ahead bias).
    """
    try:
        parsed_date = date.fromisoformat(target_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: '{target_date}'. Expected YYYY-MM-DD."
        )

    # 1. Compute decision cutoff: D-1 at cutoff_hour:cutoff_minute UTC
    cutoff_dt = ForecastService.calculate_cutoff_timestamp(
        delivery_date=parsed_date,
        cutoff_hour=cutoff_hour,
        cutoff_minute=cutoff_minute
    )

    # 2. Fetch actual generation (FUELHH wind)
    actuals, act_source, act_warnings = await elexon_client.fetch_actual_wind_generation(parsed_date)

    # 3. Fetch forecasts (WINDFOR)
    forecasts, fc_source, fc_warnings = await elexon_client.fetch_forecast_wind_generation(parsed_date)

    combined_warnings = act_warnings + fc_warnings
    data_source = act_source if act_source == fc_source else f"{act_source} / {fc_source}"

    # 4. Filter forecasts to strictly publish_time <= cutoff_dt, pick latest eligible, and match SPs
    periods = ForecastService.filter_and_align(
        target_date=parsed_date,
        raw_actuals=actuals,
        raw_forecasts=forecasts,
        cutoff_dt=cutoff_dt
    )

    # 5. Compute statistical metrics
    metrics = MetricsService.calculate_metrics(periods)

    cutoff_desc = (
        f"Day-Ahead purchasing decision cutoff set to {cutoff_dt.strftime('%Y-%m-%d %H:%M:%S UTC')} "
        f"(Day D-1 {cutoff_hour:02d}:{cutoff_minute:02d} UTC). Forecasts published after this cutoff are excluded."
    )

    return ForecastAnalysisResponse(
        target_date=target_date,
        cutoff_time_utc=cutoff_dt.isoformat(),
        cutoff_description=cutoff_desc,
        data_source=data_source,
        metrics=metrics,
        periods=periods,
        commercial_context=COMMERCIAL_GUIDANCE,
        warnings=combined_warnings
    )


@router.get("/summary/monthly")
async def get_monthly_summary(year: int = 2026, month: int = 1):
    """
    Computes aggregated performance metrics across all days of the specified month.
    """
    if year != 2026 or month != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Benchmark dataset currently loaded for January 2026."
        )

    dates = BenchmarkDataStore.get_available_dates()
    daily_summaries = []
    all_periods = []

    for d_str in dates:
        parsed_d = date.fromisoformat(d_str)
        cutoff_dt = ForecastService.calculate_cutoff_timestamp(parsed_d)
        acts = BenchmarkDataStore.get_benchmark_actuals(parsed_d) or []
        fcs = BenchmarkDataStore.get_benchmark_forecasts(parsed_d) or []

        matched = ForecastService.filter_and_align(parsed_d, acts, fcs, cutoff_dt)
        all_periods.extend(matched)
        d_metrics = MetricsService.calculate_metrics(matched)

        daily_summaries.append({
            "date": d_str,
            "mae_mw": d_metrics.mae_mw,
            "rmse_mw": d_metrics.rmse_mw,
            "bias_mw": d_metrics.bias_mw,
            "total_actual_mwh": d_metrics.total_actual_mwh,
            "total_forecast_mwh": d_metrics.total_forecast_mwh,
            "valid_periods": d_metrics.valid_periods,
            "quality_score": d_metrics.data_quality_score
        })

    overall_metrics = MetricsService.calculate_metrics(all_periods)

    return {
        "period": f"{year:04d}-{month:02d}",
        "total_days": len(dates),
        "total_settlement_periods": len(all_periods),
        "overall_metrics": overall_metrics,
        "daily_breakdown": daily_summaries
    }
