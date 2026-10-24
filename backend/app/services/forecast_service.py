from datetime import datetime, date, time, timedelta, timezone
from typing import Dict, List, Optional, Tuple, Any
from backend.app.models import SettlementPeriodObservation


class ForecastService:
    """
    Handles timestamp alignment, day-ahead cutoff enforcement,
    and latest eligible forecast selection.
    """

    @staticmethod
    def calculate_cutoff_timestamp(
        delivery_date: date,
        cutoff_hour: int = 17,
        cutoff_minute: int = 0
    ) -> datetime:
        """
        Calculate the standard Day-Ahead decision cutoff timestamp in UTC.
        By default, Day-Ahead wholesale purchasing decisions for delivery day D
        close on day D-1 at 17:00:00 UTC (or 12:00:00 UTC for Day-Ahead auctions).
        """
        d_minus_1 = delivery_date - timedelta(days=1)
        return datetime.combine(
            d_minus_1,
            time(cutoff_hour, cutoff_minute, 0, tzinfo=timezone.utc)
        )

    @staticmethod
    def get_half_hour_range(delivery_date: date, settlement_period: int) -> Tuple[datetime, datetime]:
        """
        Convert settlement period (1-48) on a date into UTC start and end datetimes.
        SP 1: 00:00 - 00:30 UTC
        SP 2: 00:30 - 01:00 UTC
        ...
        SP 48: 23:30 - 24:00 (next day 00:00) UTC
        """
        day_start = datetime.combine(delivery_date, time(0, 0, 0, tzinfo=timezone.utc))
        start_offset = timedelta(minutes=(settlement_period - 1) * 30)
        end_offset = timedelta(minutes=settlement_period * 30)
        return day_start + start_offset, day_start + end_offset

    @classmethod
    def filter_and_align(
        cls,
        target_date: date,
        raw_actuals: List[Dict[str, Any]],
        raw_forecasts: List[Dict[str, Any]],
        cutoff_dt: datetime,
        total_expected_periods: int = 48
    ) -> List[SettlementPeriodObservation]:
        """
        Aligns actual FUELHH records with the latest eligible WINDFOR forecast
        published before or at cutoff_dt.

        Enforces:
          1. Strict Day-Ahead boundary: forecasts published > cutoff_dt are ignored.
          2. Latest eligible selection: if multiple forecasts <= cutoff_dt exist for period P,
             select the one with max publish_time.
          3. Timestamp consistency and missing record detection.
          4. Zero is not injected for missing records.
        """
        date_str = target_date.isoformat()

        # 1. Index actuals by settlement period
        # Record format: {"settlementDate": "YYYY-MM-DD", "settlementPeriod": int, "fuelType": "WIND", "generation": float}
        actual_map: Dict[int, float] = {}
        actual_flags_map: Dict[int, List[str]] = {}

        for act in raw_actuals:
            # Ensure fuel type is wind
            fuel = str(act.get("fuelType", "")).upper()
            if fuel and fuel != "WIND":
                continue

            sp = act.get("settlementPeriod")
            gen = act.get("generation")
            if sp is not None and isinstance(sp, int):
                flags = []
                if gen is not None:
                    try:
                        val = float(gen)
                        if val < 0:
                            flags.append("INVALID_NEGATIVE_ACTUAL")
                            actual_map[sp] = val
                        else:
                            actual_map[sp] = val
                    except (ValueError, TypeError):
                        flags.append("INVALID_ACTUAL_FORMAT")
                else:
                    flags.append("MISSING_ACTUAL")
                actual_flags_map[sp] = flags

        # 2. Filter forecasts: keep only publish_time <= cutoff_dt, then select latest per period
        # Forecast format: {"settlementDate": "YYYY-MM-DD", "settlementPeriod": int, "publishTime": ISO_str/dt, "generation": float}
        forecast_candidate_map: Dict[int, Dict[str, Any]] = {}

        for fc in raw_forecasts:
            sp = fc.get("settlementPeriod")
            if sp is None or not isinstance(sp, int):
                continue

            pub_time_raw = fc.get("publishTime")
            if not pub_time_raw:
                continue

            # Parse publishTime to datetime UTC
            if isinstance(pub_time_raw, str):
                pub_dt = datetime.fromisoformat(pub_time_raw.replace("Z", "+00:00"))
            elif isinstance(pub_time_raw, datetime):
                pub_dt = pub_time_raw if pub_time_raw.tzinfo else pub_time_raw.replace(tzinfo=timezone.utc)
            else:
                continue

            # Enforce Day-Ahead decision cutoff: Ignore forecasts published after cutoff
            if pub_dt > cutoff_dt:
                continue

            # Keep the latest eligible publication for this settlement period
            if sp not in forecast_candidate_map:
                forecast_candidate_map[sp] = {"publish_dt": pub_dt, "data": fc}
            else:
                if pub_dt > forecast_candidate_map[sp]["publish_dt"]:
                    forecast_candidate_map[sp] = {"publish_dt": pub_dt, "data": fc}

        # 3. Build unified 1..total_expected_periods observation list
        observations: List[SettlementPeriodObservation] = []

        for sp in range(1, total_expected_periods + 1):
            start_dt, end_dt = cls.get_half_hour_range(target_date, sp)
            flags: List[str] = []

            # Actual
            actual_val = actual_map.get(sp)
            if sp in actual_flags_map:
                flags.extend(actual_flags_map[sp])
            elif actual_val is None:
                flags.append("MISSING_ACTUAL")

            # Forecast
            forecast_val: Optional[float] = None
            forecast_pub_str: Optional[str] = None

            if sp in forecast_candidate_map:
                fc_entry = forecast_candidate_map[sp]
                fc_data = fc_entry["data"]
                gen_raw = fc_data.get("generation")
                if gen_raw is not None:
                    try:
                        f_num = float(gen_raw)
                        if f_num < 0:
                            flags.append("INVALID_NEGATIVE_FORECAST")
                        forecast_val = f_num
                    except (ValueError, TypeError):
                        flags.append("INVALID_FORECAST_FORMAT")
                else:
                    flags.append("MISSING_FORECAST")
                forecast_pub_str = fc_entry["publish_dt"].isoformat()
            else:
                flags.append("MISSING_FORECAST")

            # Matched pair metrics
            is_valid = actual_val is not None and forecast_val is not None
            error_val: Optional[float] = None
            abs_error_val: Optional[float] = None

            if is_valid:
                error_val = round(forecast_val - actual_val, 2) # type: ignore
                abs_error_val = round(abs(error_val), 2)
                flags.append("VALID_MATCHED_PAIR")

            observations.append(
                SettlementPeriodObservation(
                    settlement_date=date_str,
                    settlement_period=sp,
                    start_time_utc=start_dt.isoformat(),
                    end_time_utc=end_dt.isoformat(),
                    actual_mw=round(actual_val, 2) if actual_val is not None else None,
                    forecast_mw=round(forecast_val, 2) if forecast_val is not None else None,
                    forecast_publish_time_utc=forecast_pub_str,
                    error_mw=error_val,
                    abs_error_mw=abs_error_val,
                    is_valid_pair=is_valid,
                    data_quality_flags=list(set(flags))
                )
            )

        return observations
