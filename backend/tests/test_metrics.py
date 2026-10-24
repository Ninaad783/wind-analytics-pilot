import math
import pytest
from backend.app.models import SettlementPeriodObservation
from backend.app.services.metrics_service import MetricsService


def test_hand_calculated_metrics_deterministic():
    """
    Hand-calculated unit test with known mathematical expectations.
    
    Settlement Periods:
      SP 1: Actual = 100.0 MW, Forecast = 120.0 MW -> Error = +20.0 MW, |Error| = 20.0, Sq = 400.0
      SP 2: Actual = 200.0 MW, Forecast = 180.0 MW -> Error = -20.0 MW, |Error| = 20.0, Sq = 400.0
      SP 3: Actual = 150.0 MW, Forecast = 150.0 MW -> Error =   0.0 MW, |Error| =  0.0, Sq =   0.0
      SP 4: Actual = 250.0 MW, Forecast = 300.0 MW -> Error = +50.0 MW, |Error| = 50.0, Sq = 2500.0
      
    Manual Results:
      N = 4
      Sum(Error) = 20 - 20 + 0 + 50 = 50.0 MW
      Bias = 50.0 / 4 = 12.50 MW
      
      Sum(|Error|) = 20 + 20 + 0 + 50 = 90.0 MW
      MAE = 90.0 / 4 = 22.50 MW
      
      Sum(Error^2) = 400 + 400 + 0 + 2500 = 3300.0 MW^2
      MSE = 3300.0 / 4 = 825.0 MW^2
      RMSE = sqrt(825.0) = 28.7228... -> 28.72 MW
      
      Total Actual MWh = (100 + 200 + 150 + 250) * 0.5 = 700 * 0.5 = 350.0 MWh
      Total Forecast MWh = (120 + 180 + 150 + 300) * 0.5 = 750 * 0.5 = 375.0 MWh
    """
    observations = [
        SettlementPeriodObservation(
            settlement_date="2026-01-15",
            settlement_period=1,
            start_time_utc="2026-01-15T00:00:00Z",
            end_time_utc="2026-01-15T00:30:00Z",
            actual_mw=100.0,
            forecast_mw=120.0,
            is_valid_pair=True
        ),
        SettlementPeriodObservation(
            settlement_date="2026-01-15",
            settlement_period=2,
            start_time_utc="2026-01-15T00:30:00Z",
            end_time_utc="2026-01-15T01:00:00Z",
            actual_mw=200.0,
            forecast_mw=180.0,
            is_valid_pair=True
        ),
        SettlementPeriodObservation(
            settlement_date="2026-01-15",
            settlement_period=3,
            start_time_utc="2026-01-15T01:00:00Z",
            end_time_utc="2026-01-15T01:30:00Z",
            actual_mw=150.0,
            forecast_mw=150.0,
            is_valid_pair=True
        ),
        SettlementPeriodObservation(
            settlement_date="2026-01-15",
            settlement_period=4,
            start_time_utc="2026-01-15T01:30:00Z",
            end_time_utc="2026-01-15T02:00:00Z",
            actual_mw=250.0,
            forecast_mw=300.0,
            is_valid_pair=True
        ),
    ]

    metrics = MetricsService.calculate_metrics(observations)

    assert metrics.total_periods == 4
    assert metrics.valid_periods == 4
    assert metrics.missing_actual_count == 0
    assert metrics.missing_forecast_count == 0
    assert metrics.data_quality_score == 100.0

    # Precise assertions matching hand calculation
    assert metrics.bias_mw == 12.50
    assert metrics.mae_mw == 22.50
    assert metrics.rmse_mw == 28.72
    assert metrics.total_actual_mwh == 350.0
    assert metrics.total_forecast_mwh == 375.0


def test_metrics_missing_data_integrity():
    """
    Verifies that missing actual or forecast records are NEVER coerced to zero.
    """
    observations = [
        # SP 1: Missing forecast
        SettlementPeriodObservation(
            settlement_date="2026-01-15",
            settlement_period=1,
            start_time_utc="2026-01-15T00:00:00Z",
            end_time_utc="2026-01-15T00:30:00Z",
            actual_mw=100.0,
            forecast_mw=None,
            is_valid_pair=False
        ),
        # SP 2: Missing actual
        SettlementPeriodObservation(
            settlement_date="2026-01-15",
            settlement_period=2,
            start_time_utc="2026-01-15T00:30:00Z",
            end_time_utc="2026-01-15T01:00:00Z",
            actual_mw=None,
            forecast_mw=180.0,
            is_valid_pair=False
        ),
        # SP 3: Valid pair (actual 200, forecast 220 -> error = +20)
        SettlementPeriodObservation(
            settlement_date="2026-01-15",
            settlement_period=3,
            start_time_utc="2026-01-15T01:00:00Z",
            end_time_utc="2026-01-15T01:30:00Z",
            actual_mw=200.0,
            forecast_mw=220.0,
            is_valid_pair=True
        ),
    ]

    metrics = MetricsService.calculate_metrics(observations)

    assert metrics.total_periods == 3
    assert metrics.valid_periods == 1
    assert metrics.missing_actual_count == 1
    assert metrics.missing_forecast_count == 1
    assert metrics.data_quality_score == 33.33

    # Computed strictly over the 1 valid period without zero substitution
    assert metrics.mae_mw == 20.0
    assert metrics.rmse_mw == 20.0
    assert metrics.bias_mw == 20.0


def test_metrics_empty_dataset():
    """Verifies that an empty dataset returns None for stats without raising an exception."""
    metrics = MetricsService.calculate_metrics([])
    assert metrics.total_periods == 0
    assert metrics.valid_periods == 0
    assert metrics.mae_mw is None
    assert metrics.rmse_mw is None
    assert metrics.bias_mw is None
    assert metrics.data_quality_score == 0.0
