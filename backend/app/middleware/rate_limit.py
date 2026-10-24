import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from backend.app.config import settings


class SlidingWindowRateLimiter(BaseHTTPMiddleware):
    """
    In-memory sliding window rate limiter per client IP.
    Protects API from Denial of Service (DoS) and excessive automated polling.
    """

    def __init__(self, app, max_requests: int = 120, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # ip -> list of request timestamps
        self.client_requests: Dict[str, List[float]] = defaultdict(list)

    def _clean_old_requests(self, client_ip: str, current_time: float) -> None:
        cutoff = current_time - self.window_seconds
        self.client_requests[client_ip] = [
            ts for ts in self.client_requests[client_ip] if ts > cutoff
        ]

    async def dispatch(self, request: Request, call_next) -> Response:
        # Exclude internal health checks from rate limiting
        if request.url.path.startswith("/health"):
            return await call_next(request)

        # Determine client IP (handles X-Forwarded-For if reverse-proxied)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        elif request.client and request.client.host:
            client_ip = request.client.host
        else:
            client_ip = "unknown_client"

        current_time = time.time()
        self._clean_old_requests(client_ip, current_time)

        if len(self.client_requests[client_ip]) >= self.max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "detail": f"Maximum {self.max_requests} requests per {self.window_seconds} seconds allowed.",
                    "retry_after_seconds": int(self.window_seconds - (current_time - self.client_requests[client_ip][0]))
                },
                headers={"Retry-After": str(self.window_seconds)}
            )

        self.client_requests[client_ip].append(current_time)
        return await call_next(request)
