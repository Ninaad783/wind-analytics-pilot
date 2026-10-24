import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_security_headers_present_on_all_responses():
    """OWASP Security Check: Ensure standard defensive headers are present."""
    resp = client.get("/health")
    assert resp.status_code == 200
    headers = resp.headers

    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "default-src 'self'" in headers.get("Content-Security-Policy", "")
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_sql_injection_attempt_in_query_params():
    """Security Check: SQL injection attempts must be rejected by parameter validation."""
    malicious_date = "2026-01-01' OR 1=1 --"
    resp = client.get(f"/api/analysis?target_date={malicious_date}")
    assert resp.status_code in (400, 422)


def test_xss_injection_attempt():
    """Security Check: Cross-site scripting strings in query parameters."""
    xss_payload = "<script>alert('xss')</script>"
    resp = client.get(f"/api/analysis?target_date={xss_payload}")
    assert resp.status_code in (400, 422)
    # Ensure raw script tag is not reflected unescaped in response body
    assert "<script>" not in resp.text


def test_path_traversal_attempt():
    """Security Check: Path traversal attempts must be blocked."""
    traversal = "../../../../etc/passwd"
    resp = client.get(f"/api/analysis?target_date={traversal}")
    assert resp.status_code in (400, 422)


def test_cors_preflight_and_origin_headers():
    """Security Check: Validates CORS behavior."""
    resp = client.options(
        "/api/dates",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_rate_limiting_triggers_429():
    """Security Check: Rapid request bursts exceed limit and return HTTP 429."""
    # Custom client to hit endpoint rapidly
    # The rate limiter is set to 120 per minute; let's trigger it using a custom lightweight loop
    hit_429 = False
    for _ in range(130):
        r = client.get("/api/dates")
        if r.status_code == 429:
            hit_429 = True
            assert "Retry-After" in r.headers
            assert r.json().get("error") == "Rate limit exceeded"
            break
    assert hit_429 is True
