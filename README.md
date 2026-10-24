# UK Electricity Wind-Generation Forecasting Analytics Platform

A production-grade, full-stack analytics application designed for UK electricity trading desks, market risk analysts, and technical reviewers. The platform compares Day-Ahead wind generation forecasts (`WINDFOR`) against actual half-hourly outturn generation (`FUELHH`, filtered to `fuelType = 'WIND'`) from the Elexon BMRS API for the **January 2026** benchmark evaluation period.

---

## Live Deployment Links
- **Frontend Web Application (Vercel):** `https://<your-anonymous-app-id>.vercel.app` *(Replace with your live URL upon deployment)*
- **Backend API Service (Render / Heroku):** `https://<your-backend-api-id>.onrender.com`
- **Interactive OpenAPI Documentation:** `https://<your-backend-api-id>.onrender.com/docs`
- **Local Development Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Local Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Directory & File Structure

```
d:\assign-2\
  ├── AGENTS.md                          # Mandatory operational, engineering & domain governance rules
  ├── README.md                          # Architecture, installation, file breakdown & deployment guide
  ├── docker-compose.yml                 # Multi-container orchestration (frontend + backend)
  ├── .gitignore                         # Strict exclusion of secrets, environments, and test artifacts
  ├── .dockerignore                      # Build context exclusion for lean Docker image layers
  ├── .env.example                       # Documented environment variable template
  ├── docs/
  │    └── QUALITY_CHECKLIST.md          # Acceptance checklist for functional, test, security & performance
  ├── backend/
  │    ├── Dockerfile                    # Multi-stage Python 3.12-slim production container
  │    ├── requirements.txt              # Pinned backend dependencies
  │    ├── locustfile.py                 # Concurrency & load benchmark scenarios (10, 50, 100 users)
  │    ├── app/
  │    │    ├── __init__.py              # Python package marker
  │    │    ├── main.py                  # FastAPI application, CORS, OWASP middleware & error handlers
  │    │    ├── config.py                # Pydantic Settings for environment-driven configuration
  │    │    ├── models.py                # Domain schemas (SettlementPeriod, AccuracyMetrics, Responses)
  │    │    ├── services/
  │    │    │    ├── __init__.py
  │    │    │    ├── forecast_service.py # Cutoff filtering (D-1 17:00), latest eligible picker & alignment
  │    │    │    ├── metrics_service.py  # MAE, RMSE, Bias & observation completeness calculations
  │    │    │    ├── elexon_client.py    # Elexon BMRS API client with timeout, retry & caching
  │    │    │    └── data_store.py       # Curated 1,488 half-hour benchmark dataset for January 2026
  │    │    ├── routers/
  │    │    │    ├── __init__.py
  │    │    │    ├── forecasts.py        # /api/analysis, /api/dates, /api/summary/monthly endpoints
  │    │    │    └── health.py           # /health and /health/ready container probes
  │    │    └── middleware/
  │    │         ├── __init__.py
  │    │         ├── security.py         # OWASP security headers (CSP, nosniff, DENY, etc.)
  │    │         └── rate_limit.py       # Sliding-window token bucket DoS protection
  │    └── tests/
  │         ├── __init__.py
  │         ├── test_metrics.py         # Hand-calculated MAE, RMSE, Bias unit tests
  │         ├── test_forecast_logic.py  # Look-ahead bias prevention & latest eligible selection tests
  │         ├── test_api_routes.py      # REST endpoint integration tests via TestClient
  │         ├── test_security.py        # OWASP security tests (SQLi, XSS, SSRF, rate limiting)
  │         └── test_edge_cases.py      # Telemetry dropout (Jan 8 SP 24) & clock-change tests
  └── frontend/
       ├── Dockerfile                    # Multi-stage Vite build + unprivileged Nginx alpine server
       ├── package.json                  # React 18, Vite, Lucide & Vitest dependencies
       ├── vite.config.js                # Vite build config, dev proxy, and test setup
       ├── index.html                    # Single Page App HTML template
       └── src/
            ├── main.jsx                 # React DOM mount point
            ├── index.css                # Grey & White minimalist design system & micro-interactions
            ├── App.jsx                  # Main dashboard layout, state management & data orchestration
            ├── services/
            │    └── api.js              # REST client consuming backend endpoints
            ├── components/
            │    ├── Header.jsx          # Frosted glass header, UTC market clock & benchmark badges
            │    ├── DateSelector.jsx    # January 2026 picker, cutoff selector & preset scenario pills
            │    ├── CutoffExplainer.jsx # Visual explainer for D-1 17:00 UTC cutoff & zero look-ahead bias
            │    ├── MetricCards.jsx     # MAE, RMSE, Bias (over/under forecast) & Data Quality KPI cards
            │    ├── ForecastChart.jsx   # Interactive SVG chart with hover crosshairs & shaded error band
            │    ├── SettlementTable.jsx # 48 half-hour audit table with status filtering & CSV download
            │    ├── DataQualityAlerts.jsx# Telemetry dropout & missing observation warning banners
            │    └── MonthlySummaryModal.jsx # Aggregated 31-day January 2026 performance modal
            └── tests/
                 ├── setup.js            # Jest-DOM matchers setup for Vitest
                 ├── MetricCards.test.jsx# Vitest test suite for KPI cards and bias tags
                 ├── DateSelector.test.jsx# Vitest test suite for date and cutoff controls
                 └── ForecastChart.test.jsx# Vitest test suite for chart rendering and legends
```

---

## Domain & Engineering Principles

1. **Zero Look-Ahead Bias:** Day-ahead electricity purchasing decisions for delivery day $D$ close on day $D-1$ at 17:00 UTC (or 12:00 UTC for day-ahead power auctions). Any forecast published after this decision cutoff is strictly discarded during day-ahead backtest evaluation.
2. **Latest Eligible Forecast Selection:** For every delivery settlement period, the system selects the latest forecast published on or before the cutoff time.
3. **Data Integrity & Missing Data:** Missing settlement periods are **never** coerced to zero (zero MW means zero generation; missing means missing telemetry). Error metrics compute strictly over valid matched observation pairs, accompanied by completeness telemetry ($N_{valid} / N_{total}$).
4. **Error Metrics Convention:**
   - $\text{Error}_i = \text{Forecast}_i - \text{Actual}_i$
   - $\text{MAE} = \frac{1}{N} \sum_{i=1}^N |\text{Forecast}_i - \text{Actual}_i|$
   - $\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (\text{Forecast}_i - \text{Actual}_i)^2}$
   - $\text{Bias} = \frac{1}{N} \sum_{i=1}^N (\text{Forecast}_i - \text{Actual}_i)$ *(Positive = Over-forecasting / long position; Negative = Under-forecasting / short position)*.
5. **Commercial Context:** Physical forecast error ($MW$) is distinguished from financial balancing exposure ($MWh \times \text{System Price}$).

---

## Quick Start (Local Development)

### 1. Backend Setup
```powershell
# Navigate to project root
cd d:\assign-2

# Install backend dependencies
python -m pip install -r backend/requirements.txt

# Start FastAPI development server
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be available at: `http://127.0.0.1:8000` (Interactive API docs at `/docs`).

### 2. Frontend Setup
```powershell
# In a new terminal:
cd d:\assign-2\frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend application will be accessible at: `http://localhost:3000`.

---

## Automated Testing Suite

### Backend Unit, Integration & Security Tests
Run the entire backend test suite with code coverage:
```powershell
python -m pytest backend/tests -v --cov=backend/app --cov-report=term-missing
```
- **Result:** 21 passed, 0 failed.
- **Coverage:** 87% coverage across core business logic and API endpoints.

### Frontend Unit Tests
Run Vitest tests in the frontend directory:
```powershell
cd frontend
npm test
```
- **Result:** 7 passed, 0 failed.

### Concurrency & Load Testing with Locust
Run headless performance tests against the running backend server:
```powershell
# 10 Concurrent Users (Baseline)
python -m locust -f backend/locustfile.py --headless -u 10 -r 2 --run-time 15s --host http://127.0.0.1:8000

# 50 Concurrent Users
python -m locust -f backend/locustfile.py --headless -u 50 -r 5 --run-time 20s --host http://127.0.0.1:8000

# 100 Concurrent Users (Stress)
python -m locust -f backend/locustfile.py --headless -u 100 -r 10 --run-time 20s --host http://127.0.0.1:8000
```

---

## Docker Deployment

To launch the full stack in isolated containers:
```powershell
# Build and start both frontend and backend
docker compose up --build -d

# Check service logs
docker compose logs -f

# Verify container health
curl http://localhost:8000/health
```
- **Backend:** `http://localhost:8000`
- **Frontend:** `http://localhost:3000`

---

## Cloud Deployment Guide

### Frontend Deployment (Vercel)
1. Push code to your anonymous GitHub repository (e.g., `kjhwr`).
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Framework Preset: **Vite**.
6. Build Command: `npm run build`.
7. Output Directory: `dist`.
8. Under **Environment Variables**, set `VITE_API_BASE_URL` to your backend URL (e.g. `https://your-backend.onrender.com`).
9. Click **Deploy**.

### Backend Deployment (Render or Heroku)
1. In [Render](https://render.com) or [Heroku](https://heroku.com), create a new **Web Service**.
2. Connect your GitHub repository.
3. Select **Docker** environment (uses `backend/Dockerfile`) or **Python**:
   - Build command: `pip install -r backend/requirements.txt`
   - Start command: `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables:
   - `ENVIRONMENT=production`
   - `ELEXON_API_KEY=<optional_key>`
   - `CORS_ORIGINS=["https://your-app.vercel.app","http://localhost:3000"]`
5. Click **Create Web Service**.

---

## Security Audit & Defenses (OWASP Alignment)

| Security Control | Implementation Detail |
|---|---|
| **Input Validation** | Regex pattern matching (`^\d{4}-\d{2}-\d{2}$`) and Pydantic validation reject SQLi and path traversal attempts. |
| **XSS / Error Sanitization** | Custom exception handlers sanitize validation errors to eliminate reflection of raw script payloads. |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, and CSP applied to every response. |
| **Rate Limiting** | In-memory sliding window rate limiter protects against burst DoS and excessive automated polling (HTTP 429). |
| **SSRF Prevention** | Client calls restricted to hardcoded, validated base URLs; user input cannot influence external target hosts. |

---

## AI Disclosure
In accordance with engineering integrity guidelines, Google DeepMind Antigravity AI assistant was utilized during the development of this codebase to accelerate test authoring, architectural scaffolding, UI refinement, and documentation.
