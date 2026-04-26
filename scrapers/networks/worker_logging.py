"""JSON log lines for cron workers (stderr-friendly for Docker)."""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


_EXTRA_KEYS = frozenset(
    {
        "component",
        "status_code",
        "http_status",
        "error_code",
        "keywords",
        "operation",
        "feed",
        "items",
        "sent",
        "exception_type",
        "msg_key",
    }
)


class JsonFormatter(logging.Formatter):
    """One JSON object per log record."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        for k in _EXTRA_KEYS:
            if hasattr(record, k):
                payload[k] = getattr(record, k)
        return json.dumps(payload, separators=(",", ":"), default=str)


def configure_worker_logging(level: int = logging.INFO) -> None:
    root = logging.getLogger()
    if root.handlers:
        return
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(JsonFormatter())
    root.addHandler(handler)
    root.setLevel(level)
