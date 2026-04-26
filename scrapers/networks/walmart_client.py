"""Signed GET client for Walmart Affiliate product feeds."""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

import requests

from networks.rate_limit import TokenBucketPacer
from networks.walmart_sign import build_walmart_headers

log = logging.getLogger(__name__)


class WalmartHttpError(Exception):
    def __init__(self, message: str, *, http_status: int | None = None, body: str | None = None) -> None:
        super().__init__(message)
        self.http_status = http_status
        self.body = body


class WalmartAffiliateClient:
    FEED_SPECIALBUYS = "/api-proxy/service/affil/product/v2/feeds/specialbuys"

    def __init__(
        self,
        *,
        consumer_id: str,
        key_version: str,
        private_key_path: str,
        api_base: str = "https://developer.api.walmart.com",
        session: requests.Session | None = None,
        min_interval_seconds: float = 0.35,
    ) -> None:
        self._consumer_id = consumer_id
        self._key_version = key_version
        self._private_key_path = private_key_path
        self._api_base = api_base.rstrip("/")
        self._session = session or requests.Session()
        self._pacer = TokenBucketPacer(min_interval_seconds)

    def get_feed_items(self, feed_path: str = FEED_SPECIALBUYS) -> list[dict[str, Any]]:
        self._pacer.wait_turn()
        ts = str(int(time.time() * 1000))
        headers = build_walmart_headers(
            consumer_id=self._consumer_id,
            key_version=self._key_version,
            private_key_path=self._private_key_path,
            timestamp_ms=ts,
        )
        headers["WM_QOS.CORRELATION_ID"] = str(uuid.uuid4())
        url = f"{self._api_base}{feed_path}"
        resp = self._session.get(url, headers=headers, timeout=45)
        if resp.status_code >= 400:
            log.error(
                "Walmart feed HTTP error",
                extra={
                    "component": "walmart_affiliate",
                    "http_status": resp.status_code,
                    "feed": feed_path,
                },
            )
            raise WalmartHttpError(
                f"HTTP {resp.status_code}",
                http_status=resp.status_code,
                body=resp.text[:2000],
            )
        try:
            data = resp.json()
        except ValueError as exc:
            raise WalmartHttpError("invalid JSON", http_status=resp.status_code, body=resp.text[:500]) from exc

        if isinstance(data, list):
            return [x for x in data if isinstance(x, dict)]
        items = data.get("items") if isinstance(data, dict) else None
        if isinstance(items, list):
            return [x for x in items if isinstance(x, dict)]
        feed = data.get("feed") if isinstance(data, dict) else None
        if isinstance(feed, list):
            return [x for x in feed if isinstance(x, dict)]
        return []
