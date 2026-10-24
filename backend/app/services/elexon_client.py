import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
import httpx
from backend.app.config import settings
from backend.app.services.data_store import BenchmarkDataStore

logger = logging.getLogger(__name__)


class ElexonClient:
    """
    Client for interacting with the Elexon BMRS / Insights Solution API.
    Guards against external API downtime, rate limits, and SSRF attacks
    by restricting requests exclusively to the validated base URL.
    """

    _cache: Dict[str, Tuple[datetime, Any]] = {}

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = (base_url or settings.ELEXON_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.ELEXON_API_KEY
        self.timeout = settings.REQUEST_TIMEOUT_SECONDS

    def _get_cache(self, key: str) -> Optional[Any]:
        if key in self._cache:
            ts, val = self._cache[key]
            if datetime.now(timezone.utc) - ts < timedelta(seconds=settings.CACHE_TTL_SECONDS):
                return val
            del self._cache[key]
        return None

    def _set_cache(self, key: str, val: Any) -> None:
        self._cache[key] = (datetime.now(timezone.utc), val)

    async def fetch_actual_wind_generation(
        self, target_date: date
    ) -> Tuple[List[Dict[str, Any]], str, List[str]]:
        """
        Fetch FUELHH actual wind generation records for target date.
        Returns: (records, source_name, warnings)
        """
        date_str = target_date.isoformat()
        cache_key = f"actuals_{date_str}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached, "CACHE", []

        warnings: List[str] = []

        # If target date is within January 2026, benchmark store is primary or fallback
        benchmark_data = BenchmarkDataStore.get_benchmark_actuals(target_date)

        # Attempt live API if key is present or explicitly enabled
        if self.api_key:
            try:
                url = f"{self.base_url}/generation/actual/per-fuel-type"
                params = {
                    "settlementDateFrom": date_str,
                    "settlementDateTo": date_str,
                    "fuelType": "WIND"
                }
                headers = {"Accept": "application/json"}
                if self.api_key:
                    headers["x-api-key"] = self.api_key

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, params=params, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        records = data.get("data", []) if isinstance(data, dict) else data
                        # Filter to WIND
                        wind_records = [
                            r for r in records
                            if str(r.get("fuelType", "")).upper() == "WIND"
                        ]
                        if wind_records:
                            self._set_cache(cache_key, wind_records)
                            return wind_records, "ELEXON_BMRS_LIVE", []
                    else:
                        warnings.append(
                            f"Elexon BMRS API returned status {resp.status_code}; fell back to benchmark dataset."
                        )
            except Exception as e:
                logger.warning(f"Error fetching from live Elexon BMRS: {str(e)}")
                warnings.append(f"Live Elexon BMRS API unavailable ({type(e).__name__}); fell back to benchmark dataset.")

        # Fallback to curated benchmark data
        if benchmark_data is not None:
            self._set_cache(cache_key, benchmark_data)
            return benchmark_data, "JANUARY_2026_BENCHMARK", warnings

        return [], "UNAVAILABLE", [f"No actual wind generation data available for {date_str}."]

    async def fetch_forecast_wind_generation(
        self, target_date: date
    ) -> Tuple[List[Dict[str, Any]], str, List[str]]:
        """
        Fetch WINDFOR forecast wind generation records for target date.
        Returns: (records, source_name, warnings)
        """
        date_str = target_date.isoformat()
        cache_key = f"forecasts_{date_str}"
        cached = self._get_cache(cache_key)
        if cached:
            return cached, "CACHE", []

        warnings: List[str] = []
        benchmark_data = BenchmarkDataStore.get_benchmark_forecasts(target_date)

        if self.api_key:
            try:
                url = f"{self.base_url}/forecast/generation/wind/day-ahead"
                params = {
                    "settlementDateFrom": date_str,
                    "settlementDateTo": date_str
                }
                headers = {"Accept": "application/json"}
                if self.api_key:
                    headers["x-api-key"] = self.api_key

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, params=params, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        records = data.get("data", []) if isinstance(data, dict) else data
                        if records:
                            self._set_cache(cache_key, records)
                            return records, "ELEXON_BMRS_LIVE", []
                    else:
                        warnings.append(
                            f"Elexon BMRS Forecast API returned status {resp.status_code}; fell back to benchmark dataset."
                        )
            except Exception as e:
                logger.warning(f"Error fetching forecasts from live Elexon BMRS: {str(e)}")
                warnings.append(f"Live Elexon BMRS Forecast API unavailable ({type(e).__name__}); fell back to benchmark dataset.")

        if benchmark_data is not None:
            self._set_cache(cache_key, benchmark_data)
            return benchmark_data, "JANUARY_2026_BENCHMARK", warnings

        return [], "UNAVAILABLE", [f"No wind forecast data available for {date_str}."]
