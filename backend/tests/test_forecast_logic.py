from datetime import date, datetime, timezone
import pytest
from backend.app.services.forecast_service import ForecastService


def test_look_ahead_bias_prevention_and_latest_eligible_selection():
    """
    Critical Domain Test:
    Ensures that forecasts published after the Day-Ahead purchasing decision cutoff
    are strictly rejected, and the latest eligible forecast published before or at
    the cutoff is selected.
    """
    target_date = date(2026, 1, 15)
    # Decision cutoff: 2026-01-14 17:00:00 UTC
    cutoff_dt = ForecastService.calculate_cutoff_timestamp(
        delivery_date=target_date,
        cutoff_hour=17,
        cutoff_minute=0
    )

    raw_actuals = [
        {"settlementDate": "2026-01-15", "settlementPeriod": 1, "fuelType": "WIND", "generation": 600.0}
    ]

    raw_forecasts = [
        # Forecast 1: Early Day-Ahead (Eligible, but superseded by newer eligible forecast)
        {
            "settlementDate": "2026-01-15",
            "settlementPeriod": 1,
            "publishTime": "2026-01-14T09:00:00Z",
            "generation": 450.0
        },
        # Forecast 2: Latest Eligible Day-Ahead (Published at 16:30 UTC <= 17:00 UTC cutoff)
        {
            "settlementDate": "2026-01-15",
            "settlementPeriod": 1,
            "publishTime": "2026-01-14T16:30:00Z",
            "generation": 580.0
        },
        # Forecast 3: Post-cutoff intraday update (Published at 18:30 UTC > 17:00 UTC cutoff)
        # MUST BE IGNORED to avoid look-ahead bias!
        {
            "settlementDate": "2026-01-15",
            "settlementPeriod": 1,
            "publishTime": "2026-01-14T18:30:00Z",
            "generation": 595.0
        },
        # Forecast 4: Delivery-day gate update (Published 2026-01-15 06:00 UTC)
        # MUST BE IGNORED!
        {
            "settlementDate": "2026-01-15",
            "settlementPeriod": 1,
            "publishTime": "2026-01-15T06:00:00Z",
            "generation": 602.0
        }
    ]

    matched = ForecastService.filter_and_align(
        target_date=target_date,
        raw_actuals=raw_actuals,
        raw_forecasts=raw_forecasts,
        cutoff_dt=cutoff_dt,
        total_expected_periods=1
    )

    assert len(matched) == 1
    sp1 = matched[0]

    # Verify actual
    assert sp1.actual_mw == 600.0

    # Verify that Forecast 2 (580.0 MW @ 16:30 UTC) was selected
    assert sp1.forecast_mw == 580.0
    assert sp1.forecast_publish_time_utc == "2026-01-14T16:30:00+00:00"

    # Verify error calculation: forecast - actual = 580 - 600 = -20 MW
    assert sp1.error_mw == -20.0
    assert sp1.abs_error_mw == 20.0
    assert sp1.is_valid_pair is True


def test_fuel_type_filtering_ignores_non_wind():
    """Verifies that non-wind fuels (CCGT, NUCLEAR, SOLAR) in FUELHH are discarded."""
    target_date = date(2026, 1, 15)
    cutoff_dt = ForecastService.calculate_cutoff_timestamp(target_date)

    raw_actuals = [
        {"settlementDate": "2026-01-15", "settlementPeriod": 1, "fuelType": "CCGT", "generation": 12000.0},
        {"settlementDate": "2026-01-15", "settlementPeriod": 1, "fuelType": "NUCLEAR", "generation": 4500.0},
        {"settlementDate": "2026-01-15", "settlementPeriod": 1, "fuelType": "WIND", "generation": 750.0},
    ]

    matched = ForecastService.filter_and_align(
        target_date=target_date,
        raw_actuals=raw_actuals,
        raw_forecasts=[],
        cutoff_dt=cutoff_dt,
        total_expected_periods=1
    )

    # Actual must be strictly the WIND generation (750.0 MW), not CCGT or nuclear
    assert matched[0].actual_mw == 750.0


def test_settlement_period_half_hour_boundaries():
    """Verifies exact half-hour boundary generation in UTC."""
    target_date = date(2026, 1, 15)

    # SP 1: 00:00 -> 00:30 UTC
    s1, e1 = ForecastService.get_half_hour_range(target_date, 1)
    assert s1 == datetime(2026, 1, 15, 0, 0, tzinfo=timezone.utc)
    assert e1 == datetime(2026, 1, 15, 0, 30, tzinfo=timezone.utc)

    # SP 48: 23:30 -> 24:00 (next day 00:00) UTC
    s48, e48 = ForecastService.get_half_hour_range(target_date, 48)
    assert s48 == datetime(2026, 1, 15, 23, 30, tzinfo=timezone.utc)
    assert e48 == datetime(2026, 1, 16, 0, 0, tzinfo=timezone.utc)
