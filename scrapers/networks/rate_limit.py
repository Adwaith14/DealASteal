"""Client-side pacing for strict upstream TPS limits (PA-API ~1 TPS)."""

from __future__ import annotations

import threading
import time


class TokenBucketPacer:
    """At most one action per ``min_interval_seconds`` (default 1.0 = 1 TPS)."""

    def __init__(self, min_interval_seconds: float = 1.0) -> None:
        if min_interval_seconds < 0:
            raise ValueError("min_interval_seconds must be non-negative")
        self._min_interval = min_interval_seconds
        self._lock = threading.Lock()
        self._next_at = 0.0

    def wait_turn(self) -> None:
        if self._min_interval == 0:
            return
        with self._lock:
            now = time.monotonic()
            if now < self._next_at:
                time.sleep(self._next_at - now)
            self._next_at = time.monotonic() + self._min_interval
