from datetime import date
import pytest
from backend.app.services.data_store import BenchmarkDataStore
from backend.app.services.forecast_service import ForecastService
from backend.app.services.metrics_service import MetricsService


def test_missing_actual_telemetry_handling_jan_8():
    """
    Edge case: Verifies that settlement periods with missing telemetry (e.g. 2026-01-08 SP 24)
    are flagged with MISSING_ACTUAL and not coerced to 0 MW.
    """
    target_d = date(2026, 1, 8)
    cutoff_dt = ForecastService.calculate_cutoff_timestamp(target_d)

    actuals = BenchmarkDataStore.get_benchmark_actuals(target_d)
    forecasts = BenchmarkDataStore.get_benchmark_forecasts(target_d)
    assert actuals is not None and forecasts is not None

    periods = ForecastService.filter_and_align(target_d, actuals, forecasts, cutoff_dt)
    assert len(periods) == 48

    # Period 24 is the designated missing telemetry observation
    sp24 = periods[23]
    assert sp24.settlement_period == 24
    assert sp24.actual_mw is None
    assert sp24.is_valid_pair is False
    assert "MISSING_ACTUAL" in sp24.data_quality_flags

    # Overall metrics for the day
    metrics = MetricsService.calculate_metrics(periods)
    assert metrics.total_periods == 48
    assert metrics.valid_periods == 47
    assert metrics.missing_actual_count == 1
    assert metrics.missing_forecast_count == 0
    assert metrics.data_quality_score == 97.92


def test_custom_cutoff_boundary_12_utc():
    """
    Edge case: Verifies configuring a 12:00 UTC D-1 auction cutoff excludes
    forecasts published at 16:30 UTC D-1.
    """
    target_d = date(2026, 1, 15)
    # 12:00 UTC cutoff
    cutoff_dt_12 = ForecastService.calculate_cutoff_timestamp(target_d, cutoff_hour=12, cutoff_minute=0)
    # 17:00 UTC cutoff
    cutoff_dt_17 = ForecastService.calculate_cutoff_timestamp(target_d, cutoff_hour=17, cutoff_minute=0)

    actuals = BenchmarkDataStore.get_benchmark_actuals(target_d)
    forecasts = BenchmarkDataStore.get_benchmark_forecasts(target_d)
    assert actuals is not None and forecasts is not None

    periods_12 = ForecastService.filter_and_align(target_d, actuals, forecasts, cutoff_dt_12)
    periods_17 = ForecastService.filter_and_align(target_d, actuals, forecasts, cutoff_dt_17)

    # In periods_12, the 14:00 UTC and 16:30 UTC forecasts are after 12:00 UTC,
    # so the 09:00 UTC forecast is the latest eligible!
    assert periods_12[0].forecast_publish_time_utc == "2026-01-14T09:00:00+00:00"

    # In periods_17, the 16:30 UTC forecast is eligible and selected!
    assert periods_17[0].forecast_publish_time_utc == "2026-01-14T16:30:00+00:00"

    # Different forecasts selected based on decision cutoff
    assert periods_12[0].forecast_mw != periods_17[0].forecast_mw


def test_clock_change_non_standard_period_counts():
    """
    Edge case: UK clock change days have 46 periods (March short day) or 50 periods (October long day).
    Ensures ForecastService handles non-standard settlement period counts without error.
    """
    target_d = date(2026, 3, 29) # Clock change
    cutoff_dt = ForecastService.calculate_cutoff_timestamp(target_d)

    # Empty actuals and forecasts for 46 periods
    periods_46 = ForecastService.filter_and_align(target_d, [], [], cutoff_dt, total_expected_periods=46)
    assert len(periods_46) == 46
    assert periods_46[45].settlement_period == 46

    # 50 periods
    periods_50 = ForecastService.filter_and_align(target_d, [], [], cutoff_dt, total_expected_periods=50)
    assert len(periods_50) == 50
    assert periods_50[49].settlement_period == 50
