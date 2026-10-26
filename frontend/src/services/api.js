const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchAvailableDates() {
  const res = await fetch(`${API_BASE}/api/dates`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dates: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchForecastAnalysis(targetDate, cutoffHour = 17, cutoffMinute = 0) {
  const params = new URLSearchParams({
    target_date: targetDate,
    cutoff_hour: cutoffHour.toString(),
    cutoff_minute: cutoffMinute.toString()
  });

  const res = await fetch(`${API_BASE}/api/analysis?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || `Analysis request failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchMonthlySummary(year = 2026, month = 1) {
  const params = new URLSearchParams({
    year: year.toString(),
    month: month.toString()
  });

  const res = await fetch(`${API_BASE}/api/summary/monthly?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch monthly summary: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSystemHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: HTTP ${res.status}`);
  }
  return res.json();
}
