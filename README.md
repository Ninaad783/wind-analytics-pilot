# UK Electricity Wind-Generation Forecasting Analytics Platform

A production-grade, full-stack analytics application designed for UK electricity trading desks, market risk analysts, and technical reviewers. The platform compares Day-Ahead wind generation forecasts (`WINDFOR`) against actual half-hourly outturn generation (`FUELHH`, filtered to `fuelType = 'WIND'`) from the Elexon BMRS API for the **January 2026** benchmark evaluation period.

---

## Architecture Overview

```
+-------------------------------------------------------------+
|                 React Client (Port 3000 / 5173)             |
|  - Date Selector (Jan 2026 focus)  - Metric Cards (MAE/RMSE)|
|  - Delivery vs Publish Timeline   - Half-hourly Recharts    |
|  - Granular Settlement Data Table  - Data Quality Indicators |
+------------------------------+------------------------------+
                               | REST / JSON
                               v
+-------------------------------------------------------------+
|                FastAPI Backend (Port 8000)                  |
|  - Security Middleware (OWASP headers, sanitized errors)    |
|  - Sliding-Window Rate Limiter (Token Bucket)               |
|  - Forecast Service: Cutoff Filter & Latest Eligible Picker |
|  - Metrics Service: MAE, RMSE, Bias & Data Quality Validator|
|  - Hybrid Data Store: Live Elexon BMRS API + Jan 2026 Cache |
+-------------------------------------------------------------+
```

### Key Design Decisions & Domain Rules
1. **Zero Look-Ahead Bias:** Wholesale day-ahead electricity purchasing decisions for delivery day $D$ close on day $D-1$ at 17:00 UTC (or 12:00 UTC for day-ahead power auctions). Any forecast published after this decision cutoff is strictly discarded during day-ahead backtest evaluation.
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

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm 9+

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
# Open a new terminal in the frontend directory
cd d:\assign-2\frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend application will be accessible at: `http://localhost:3000` (or `http://localhost:5173`).

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
1. Push the code to a GitHub repository.
2. In Vercel, click **New Project** and import the repository.
3. Set the **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Configure `VITE_API_URL` environment variable pointing to the deployed backend URL.

### Backend Deployment (Heroku / Render / AWS ECS)
1. Set the build environment to Python or use the provided `backend/Dockerfile`.
2. Configure environment variables from `.env.example`:
   - `ENVIRONMENT=production`
   - `ELEXON_API_KEY=<your_api_key>`
   - `CORS_ORIGINS=["https://your-frontend-domain.vercel.app"]`
3. Procfile command (if deploying to Heroku dyno):
   ```
   web: python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
   ```

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
In accordance with engineering integrity guidelines, Google DeepMind Antigravity AI assistant was utilized during the development of this codebase to accelerate test authoring, architectural scaffolding, and documentation.
