from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class SettlementPeriodObservation(BaseModel):
    """Represents a single half-hour electricity settlement period record."""
    settlement_date: str = Field(..., description="Target delivery date (YYYY-MM-DD)")
    settlement_period: int = Field(..., ge=1, le=50, description="Half-hour settlement period (1-48, or 46/50 on clock-change days)")
    start_time_utc: str = Field(..., description="Start of delivery half-hour in UTC ISO 8601")
    end_time_utc: str = Field(..., description="End of delivery half-hour in UTC ISO 8601")
    actual_mw: Optional[float] = Field(None, description="Actual wind generation from FUELHH (MW)")
    forecast_mw: Optional[float] = Field(None, description="Day-ahead wind generation forecast from WINDFOR (MW)")
    forecast_publish_time_utc: Optional[str] = Field(None, description="Timestamp when the forecast was published in UTC ISO 8601")
    error_mw: Optional[float] = Field(None, description="Forecast error: (forecast_mw - actual_mw) in MW")
    abs_error_mw: Optional[float] = Field(None, description="Absolute forecast error in MW")
    is_valid_pair: bool = Field(False, description="True if both actual and forecast exist and are non-null")
    data_quality_flags: List[str] = Field(default_factory=list, description="Quality flags (e.g. MISSING_ACTUAL, MISSING_FORECAST)")


class ForecastAccuracyMetrics(BaseModel):
    """Calculated statistical accuracy metrics for wind forecasting."""
    mae_mw: Optional[float] = Field(None, description="Mean Absolute Error in MW")
    rmse_mw: Optional[float] = Field(None, description="Root Mean Squared Error in MW")
    bias_mw: Optional[float] = Field(None, description="Forecast Bias: mean(forecast - actual) in MW")
    mape_percent: Optional[float] = Field(None, description="Mean Absolute Percentage Error (%)")
    total_actual_mwh: Optional[float] = Field(None, description="Total energy generated (MWh = sum(actual_mw * 0.5h))")
    total_forecast_mwh: Optional[float] = Field(None, description="Total energy forecast (MWh = sum(forecast_mw * 0.5h))")
    total_periods: int = Field(..., description="Total settlement periods in the evaluation window")
    valid_periods: int = Field(..., description="Number of periods with both valid actual and eligible forecast")
    missing_actual_count: int = Field(0, description="Periods missing actual generation telemetry")
    missing_forecast_count: int = Field(0, description="Periods missing eligible forecast")
    data_quality_score: float = Field(..., ge=0.0, le=100.0, description="Percentage of valid complete periods")
    bias_interpretation: str = Field(..., description="Human-readable commercial interpretation of bias")


class ForecastAnalysisResponse(BaseModel):
    """Complete API response for a single day's day-ahead forecast analysis."""
    target_date: str = Field(..., description="Evaluated delivery date (YYYY-MM-DD)")
    cutoff_time_utc: str = Field(..., description="Day-ahead decision cutoff applied (UTC ISO 8601)")
    cutoff_description: str = Field(..., description="Explanation of the decision cutoff rule applied")
    data_source: str = Field(..., description="Data provider: ELEXON_BMRS_LIVE or JANUARY_2026_BENCHMARK")
    metrics: ForecastAccuracyMetrics
    periods: List[SettlementPeriodObservation]
    commercial_context: str = Field(..., description="Guidance distinguishing forecast accuracy from balancing procurement obligations")
    warnings: List[str] = Field(default_factory=list, description="Any data quality or availability warnings")


class AvailableDatesResponse(BaseModel):
    """List of available delivery dates for selection."""
    available_dates: List[str]
    default_date: str
    benchmark_period_description: str


class HealthStatus(BaseModel):
    """Service health response."""
    status: str
    app_name: str
    environment: str
    timestamp_utc: str
    elexon_upstream_configured: bool
