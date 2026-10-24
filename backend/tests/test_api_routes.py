import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "timestamp_utc" in data


def test_readiness_endpoint():
    resp = client.get("/health/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["benchmark_dates_loaded"] == 31


def test_available_dates_endpoint():
    resp = client.get("/api/dates")
    assert resp.status_code == 200
    data = resp.json()
    assert "available_dates" in data
    assert len(data["available_dates"]) == 31
    assert "2026-01-15" in data["available_dates"]
    assert data["default_date"] == "2026-01-15"


def test_forecast_analysis_january_2026():
    resp = client.get("/api/analysis?target_date=2026-01-15&cutoff_hour=17&cutoff_minute=0")
    assert resp.status_code == 200
    data = resp.json()

    assert data["target_date"] == "2026-01-15"
    assert "2026-01-14T17:00:00" in data["cutoff_time_utc"]
    assert len(data["periods"]) == 48

    # Verify metrics structure
    metrics = data["metrics"]
    assert metrics["total_periods"] == 48
    assert metrics["valid_periods"] == 48
    assert metrics["mae_mw"] is not None and metrics["mae_mw"] > 0
    assert metrics["rmse_mw"] is not None and metrics["rmse_mw"] > 0
    assert metrics["bias_mw"] is not None
    assert metrics["data_quality_score"] == 100.0


def test_forecast_analysis_invalid_date():
    resp = client.get("/api/analysis?target_date=invalid-string")
    assert resp.status_code == 422 or resp.status_code == 400


def test_monthly_summary():
    resp = client.get("/api/summary/monthly?year=2026&month=1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_days"] == 31
    assert data["total_settlement_periods"] == 31 * 48
    assert "overall_metrics" in data
    assert len(data["daily_breakdown"]) == 31
