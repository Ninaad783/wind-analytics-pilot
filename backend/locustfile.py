import random
from locust import HttpUser, task, between


class WindAnalyticsUser(HttpUser):
    """
    Simulates trader and analyst user behavior accessing the Wind Forecasting Analytics API.
    """
    wait_time = between(0.1, 0.5)

    JAN_DATES = [
        f"2026-01-{day:02d}" for day in range(1, 32)
    ]

    @task(3)
    def view_available_dates(self):
        """User loads date picker / landing page."""
        self.client.get("/api/dates", name="/api/dates")

    @task(6)
    def view_daily_forecast_analysis(self):
        """User inspects forecast accuracy for a random January 2026 date."""
        target_date = random.choice(self.JAN_DATES)
        self.client.get(
            f"/api/analysis?target_date={target_date}&cutoff_hour=17&cutoff_minute=0",
            name="/api/analysis [target_date]"
        )

    @task(2)
    def view_repeated_fixed_date_cache(self):
        """Simulates heavy concurrent interest in a single date (e.g., storm day 2026-01-19)."""
        self.client.get(
            "/api/analysis?target_date=2026-01-19&cutoff_hour=17&cutoff_minute=0",
            name="/api/analysis [cached fixed date 2026-01-19]"
        )

    @task(1)
    def view_monthly_summary(self):
        """Executive or risk manager loads January 2026 monthly aggregate overview."""
        self.client.get("/api/summary/monthly?year=2026&month=1", name="/api/summary/monthly")

    @task(1)
    def check_system_health(self):
        """Infrastructure / health monitoring ping."""
        self.client.get("/health", name="/health")
