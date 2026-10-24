# AGENTS.md — Project Governance & Engineering Rules

This document establishes the mandatory operational, architectural, and security rules for any human engineer, AI assistant, or automated agent working on this codebase.

## 1. Core Engineering Principles

1. **Understand Before Modifying:** Understand existing code and architecture thoroughly before introducing changes. Do not replace working implementations without clear, validated justification.
2. **Architecture & Naming Standards:** Follow established modular architecture, idiomatic Python (backend), modern React/TypeScript or JavaScript (frontend), and clean naming conventions.
3. **Modularity & Maintainability:** Keep functions and components focused on a single responsibility. Avoid monolith files or tightly coupled abstractions.
4. **Environment-Driven Configuration:** Never hardcode secrets, API keys, credentials, or environment-specific URLs. Load configuration exclusively via environment variables (`.env`).
5. **No Secret Exposure:** Never commit secrets, credentials, or sensitive tokens to Git. Keep `.gitignore` strictly updated.

## 2. Domain & Data Correctness Rules (UK Electricity & Elexon BMRS)

1. **Strict Datasets:**
   - Actual generation: Derived exclusively from Elexon BMRS `FUELHH` dataset filtered strictly to `fuelType = WIND`.
   - Forecast generation: Derived from Elexon BMRS `WINDFOR` (or day-ahead wind generation forecasts).
2. **Never Fabricate Values:** Never fabricate, interpolate, or invent missing actual generation or forecast values. If data is absent or unavailable, clearly flag it as missing or unavailable.
3. **UTC Internal Standard:** Store, process, and exchange all timestamps internally in UTC (`ISO 8601`). Convert to UK local time (`Europe/London`, respecting GMT/BST transitions) explicitly only for display/presentation purposes.
4. **Avoid Look-Ahead Bias:**
   - Day-ahead electricity purchasing decisions operate with specific cutoffs (e.g., Gate Closure or 17:00 / 12:00 day-ahead decision boundary).
   - Never use a forecast published after the relevant decision cutoff to evaluate what a trader could have known at decision time.
   - For historical decision-time evaluation, select the latest eligible forecast published *before or at* the decision cutoff for the target delivery settlement period.
5. **Distinct Publication vs. Delivery Times:** Always keep `publishTime` (when the forecast became available to market participants) and `deliveryTime` / `startTime` (the settlement half-hour during which electricity is generated) strictly separate.
6. **Handled Missing Data & Units:**
   - Missing data must never be silently converted to zero (zero MW means zero generation; missing means no telemetry/record).
   - Error metrics (MAE, RMSE, Bias) must only compute over periods where both valid actual and eligible forecast observations are available, and explicitly state the count of valid vs. missing periods.
   - Standard error metric conventions:
     - `MAE = mean(|forecast - actual|)`
     - `RMSE = sqrt(mean((forecast - actual)^2))`
     - `Bias = mean(forecast - actual)` (positive bias means over-forecasting; negative bias means under-forecasting).

## 3. Security & Resilience Standards

1. **Input Validation:** Strictly validate and sanitize all user parameters (dates, settlement periods, filters) at the API boundary using Pydantic schemas.
2. **Safe Error Handling:** Catch and handle external API timeouts, HTTP errors, rate limits, and schema variations. Never expose stack traces or raw internal exceptions to clients.
3. **CORS & Headers:** Configure Cross-Origin Resource Sharing (CORS) with explicit allowed origins. Use security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`).
4. **Defensive Testing:** Audit against OWASP Top 10 risks: injection, XSS, SSRF, path traversal, rate limiting, and resource exhaustion.
5. **No Security Bypasses:** Never disable security controls, CORS validations, or authentication checks to make a test pass.

## 4. Testing & Verification Integrity

1. **Test-Driven Rigor:** Write unit, integration, and E2E tests for every meaningful feature and bug fix.
2. **Deterministic Test Fixtures:** Mock external third-party API dependencies (e.g., Elexon BMRS) in automated unit and integration tests using deterministic fixtures.
3. **Honest Reporting:** Run relevant test suites after modifications and report results honestly. Never claim tests passed or deployments succeeded without actual verification.
4. **No Destructive Actions:** Do not make destructive changes to git history, live platforms, or remote databases without explicit user consent.
