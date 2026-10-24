import math
from typing import List, Optional, Tuple
from backend.app.models import ForecastAccuracyMetrics, SettlementPeriodObservation


class MetricsService:
    """Computes statistical accuracy metrics and data quality telemetry for wind generation."""

    @staticmethod
    def calculate_metrics(
        periods: List[SettlementPeriodObservation]
    ) -> ForecastAccuracyMetrics:
        """
        Calculate MAE, RMSE, Bias, and data quality metrics from matched settlement periods.
        
        Mathematical formulas:
          - Error: e_i = forecast_i - actual_i
          - MAE:  (1 / N) * sum(|forecast_i - actual_i|)
          - RMSE: sqrt((1 / N) * sum((forecast_i - actual_i)^2))
          - Bias: (1 / N) * sum(forecast_i - actual_i)
          - MAPE: (1 / K) * sum(|forecast_i - actual_i| / actual_i) * 100 for actual_i > 0
          - Energy MWh: sum(MW * 0.5 hours)
          
        Data Integrity Rules:
          - Missing observations are NEVER coerced to zero.
          - Incomplete periods are excluded from error averages and counted in missing telemetry.
        """
        total_periods = len(periods)
        if total_periods == 0:
            return ForecastAccuracyMetrics(
                mae_mw=None,
                rmse_mw=None,
                bias_mw=None,
                mape_percent=None,
                total_actual_mwh=None,
                total_forecast_mwh=None,
                total_periods=0,
                valid_periods=0,
                missing_actual_count=0,
                missing_forecast_count=0,
                data_quality_score=0.0,
                bias_interpretation="No settlement period data available."
            )

        valid_errors: List[float] = []
        valid_actuals: List[float] = []
        valid_forecasts: List[float] = []
        mape_fractions: List[float] = []

        missing_actual_count = 0
        missing_forecast_count = 0

        for p in periods:
            has_actual = p.actual_mw is not None and not math.isnan(p.actual_mw)
            has_forecast = p.forecast_mw is not None and not math.isnan(p.forecast_mw)

            if not has_actual:
                missing_actual_count += 1
            if not has_forecast:
                missing_forecast_count += 1

            if has_actual and has_forecast:
                # Both present
                actual = float(p.actual_mw) # type: ignore
                forecast = float(p.forecast_mw) # type: ignore
                err = forecast - actual
                valid_errors.append(err)
                valid_actuals.append(actual)
                valid_forecasts.append(forecast)

                if actual > 0.1:  # Avoid division by zero on dead calm days
                    mape_fractions.append(abs(err) / actual)

        valid_count = len(valid_errors)
        data_quality_score = round((valid_count / total_periods) * 100.0, 2) if total_periods > 0 else 0.0

        if valid_count == 0:
            return ForecastAccuracyMetrics(
                mae_mw=None,
                rmse_mw=None,
                bias_mw=None,
                mape_percent=None,
                total_actual_mwh=None,
                total_forecast_mwh=None,
                total_periods=total_periods,
                valid_periods=0,
                missing_actual_count=missing_actual_count,
                missing_forecast_count=missing_forecast_count,
                data_quality_score=data_quality_score,
                bias_interpretation="Insufficient matching observations to calculate metrics."
            )

        # MAE: mean of absolute differences
        mae = sum(abs(e) for e in valid_errors) / valid_count

        # RMSE: square root of mean squared error
        mse = sum(e * e for e in valid_errors) / valid_count
        rmse = math.sqrt(mse)

        # Bias: mean of (forecast - actual)
        bias = sum(valid_errors) / valid_count

        # MAPE: percentage
        mape = (sum(mape_fractions) / len(mape_fractions) * 100.0) if mape_fractions else None

        # Energy MWh (0.5 hour per settlement period)
        total_actual_mwh = sum(valid_actuals) * 0.5
        total_forecast_mwh = sum(valid_forecasts) * 0.5

        # Bias commercial interpretation
        if abs(bias) < 25.0:
            bias_interpretation = f"Balanced: Minimal systematic bias ({bias:+.1f} MW average error)."
        elif bias > 0:
            bias_interpretation = (
                f"Over-forecasting: Forecasts exceeded actuals by an average of {bias:+.1f} MW. "
                "Trading desks relying on this would be net long, potentially facing System Sell Price cashout penalties."
            )
        else:
            bias_interpretation = (
                f"Under-forecasting: Actual generation exceeded forecasts by an average of {abs(bias):.1f} MW. "
                "Trading desks relying on this would be net short, missing generation revenue."
            )

        return ForecastAccuracyMetrics(
            mae_mw=round(mae, 2),
            rmse_mw=round(rmse, 2),
            bias_mw=round(bias, 2),
            mape_percent=round(mape, 2) if mape is not None else None,
            total_actual_mwh=round(total_actual_mwh, 1),
            total_forecast_mwh=round(total_forecast_mwh, 1),
            total_periods=total_periods,
            valid_periods=valid_count,
            missing_actual_count=missing_actual_count,
            missing_forecast_count=missing_forecast_count,
            data_quality_score=data_quality_score,
            bias_interpretation=bias_interpretation
        )
