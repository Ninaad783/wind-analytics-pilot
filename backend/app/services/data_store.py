import math
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple


class BenchmarkDataStore:
    """
    Provides curated, deterministic benchmark data for January 2026 (2026-01-01 to 2026-01-31),
    comprising 1,488 half-hour settlement periods with authentic UK wind fleet dynamics.
    
    Includes realistic publication timelines:
      - D-1 09:00 UTC forecast (early preliminary day-ahead)
      - D-1 14:00 UTC forecast (pre-auction day-ahead)
      - D-1 16:30 UTC forecast (latest eligible forecast before 17:00 UTC cutoff)
      - D-1 21:00 UTC forecast (intraday - published AFTER 17:00 cutoff; MUST BE EXCLUDED by cutoff engine)
      - D 06:00 UTC forecast (day-of intraday; MUST BE EXCLUDED by cutoff engine)
    """

    _actuals_cache: Dict[str, List[Dict[str, Any]]] = {}
    _forecasts_cache: Dict[str, List[Dict[str, Any]]] = {}
    _initialized: bool = False

    @classmethod
    def initialize_january_2026_data(cls) -> None:
        if cls._initialized:
            return

        start_date = date(2026, 1, 1)
        end_date = date(2026, 1, 31)
        current = start_date

        # Synthetic seed parameters reflecting authentic UK winter wind regimes
        day_index = 0
        while current <= end_date:
            date_str = current.isoformat()
            actuals_list: List[Dict[str, Any]] = []
            forecasts_list: List[Dict[str, Any]] = []

            # Base wind pattern for day (winter storm, calm spell, moderate)
            # Cycle through high wind (storm), moderate, and calm high-pressure
            pattern_cycle = day_index % 7
            if pattern_cycle in (0, 1): # Storm front: 16,000 - 22,000 MW
                base_mw = 18000.0
                amplitude = 4000.0
            elif pattern_cycle in (2, 3): # Moderate windy: 9,000 - 14,000 MW
                base_mw = 11500.0
                amplitude = 2500.0
            else: # Calm high pressure spell: 2,500 - 5,500 MW
                base_mw = 4000.0
                amplitude = 1500.0

            d_minus_1 = current - timedelta(days=1)

            # Publication times for forecast runs
            pub_early_d1 = datetime.combine(d_minus_1, datetime.min.time(), tzinfo=timezone.utc).replace(hour=9, minute=0)
            pub_mid_d1   = datetime.combine(d_minus_1, datetime.min.time(), tzinfo=timezone.utc).replace(hour=14, minute=0)
            pub_cutoff_d1= datetime.combine(d_minus_1, datetime.min.time(), tzinfo=timezone.utc).replace(hour=16, minute=30) # latest eligible for 17:00
            pub_post_d1  = datetime.combine(d_minus_1, datetime.min.time(), tzinfo=timezone.utc).replace(hour=21, minute=0) # after cutoff!
            pub_day_d    = datetime.combine(current, datetime.min.time(), tzinfo=timezone.utc).replace(hour=6, minute=0)    # intraday morning!

            for sp in range(1, 49):
                # Diurnal / atmospheric variation
                theta = (sp / 48.0) * 2 * math.pi
                diurnal_shift = amplitude * math.sin(theta + (day_index * 0.4))
                
                # Actual generation (MW)
                actual_val = max(500.0, base_mw + diurnal_shift + 350.0 * math.cos(theta * 2))
                
                # Introduce specific realistic edge cases on specified days:
                # 1. 2026-01-08 SP 24: Missing telemetry (test data quality handling)
                if current == date(2026, 1, 8) and sp == 24:
                    actuals_list.append({
                        "settlementDate": date_str,
                        "settlementPeriod": sp,
                        "fuelType": "WIND",
                        "generation": None
                    })
                else:
                    actuals_list.append({
                        "settlementDate": date_str,
                        "settlementPeriod": sp,
                        "fuelType": "WIND",
                        "generation": round(actual_val, 1)
                    })

                # Forecasts:
                # 1. Early D-1 (09:00 UTC): rough model error (+- 1500 MW)
                early_fc = max(400.0, actual_val + 1200.0 * math.sin(theta + 0.8))
                forecasts_list.append({
                    "settlementDate": date_str,
                    "settlementPeriod": sp,
                    "publishTime": pub_early_d1.isoformat(),
                    "generation": round(early_fc, 1)
                })

                # 2. Mid D-1 (14:00 UTC): improved run (+- 800 MW)
                mid_fc = max(400.0, actual_val + 700.0 * math.sin(theta + 0.5))
                forecasts_list.append({
                    "settlementDate": date_str,
                    "settlementPeriod": sp,
                    "publishTime": pub_mid_d1.isoformat(),
                    "generation": round(mid_fc, 1)
                })

                # 3. Latest eligible D-1 (16:30 UTC): Final Day-Ahead Gate Run
                # On day 19: wind surged faster than models predicted (under-forecast)
                # On day 26: calm settled in faster than predicted (over-forecast)
                if current == date(2026, 1, 19):
                    final_fc = max(400.0, actual_val - 1200.0 - (sp * 15.0))
                elif current == date(2026, 1, 26):
                    final_fc = max(400.0, actual_val + 950.0 + (sp * 10.0))
                else:
                    final_fc = max(400.0, actual_val + 450.0 * math.sin(theta) - 120.0)

                forecasts_list.append({
                    "settlementDate": date_str,
                    "settlementPeriod": sp,
                    "publishTime": pub_cutoff_d1.isoformat(),
                    "generation": round(final_fc, 1)
                })

                # 4. Post-Cutoff Forecasts (21:00 UTC D-1 and 06:00 UTC Day-Of)
                # These are closer to real actuals because they had newer radar/satellite data,
                # BUT using them for day-ahead purchasing evaluation would constitute LOOK-AHEAD BIAS!
                post_fc = actual_val + 50.0 * math.cos(theta)
                forecasts_list.append({
                    "settlementDate": date_str,
                    "settlementPeriod": sp,
                    "publishTime": pub_post_d1.isoformat(),
                    "generation": round(post_fc, 1)
                })
                forecasts_list.append({
                    "settlementDate": date_str,
                    "settlementPeriod": sp,
                    "publishTime": pub_day_d.isoformat(),
                    "generation": round(actual_val + 20.0, 1)
                })

            cls._actuals_cache[date_str] = actuals_list
            cls._forecasts_cache[date_str] = forecasts_list
            current += timedelta(days=1)
            day_index += 1

        cls._initialized = True

    @classmethod
    def get_benchmark_actuals(cls, target_date: date) -> Optional[List[Dict[str, Any]]]:
        cls.initialize_january_2026_data()
        return cls._actuals_cache.get(target_date.isoformat())

    @classmethod
    def get_benchmark_forecasts(cls, target_date: date) -> Optional[List[Dict[str, Any]]]:
        cls.initialize_january_2026_data()
        return cls._forecasts_cache.get(target_date.isoformat())

    @classmethod
    def get_available_dates(cls) -> List[str]:
        cls.initialize_january_2026_data()
        return sorted(list(cls._actuals_cache.keys()))


# Pre-initialize benchmark data on load
BenchmarkDataStore.initialize_january_2026_data()
