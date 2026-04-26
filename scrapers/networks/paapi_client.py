"""HTTP client for Amazon PA-API 5 SearchItems (SigV4 + 1 TPS pacing + throttling retries)."""

from __future__ import annotations

import logging
import random
import time
from typing import Any

import requests

from networks.paapi_sign import SEARCH_ITEMS_TARGET, build_search_items_body, sign_paapi_post
from networks.rate_limit import TokenBucketPacer

log = logging.getLogger(__name__)


class PaapiError(Exception):
    def __init__(
        self,
        message: str,
        *,
        codes: list[str] | None = None,
        http_status: int | None = None,
    ) -> None:
        super().__init__(message)
        self.codes = codes or []
        self.http_status = http_status


def _error_codes_from_body(data: dict[str, Any]) -> list[str]:
    out: list[str] = []
    for e in data.get("Errors") or []:
        if isinstance(e, dict) and e.get("Code"):
            out.append(str(e["Code"]))
    return out


class PaapiClient:
    def __init__(
        self,
        *,
        access_key: str,
        secret_key: str,
        partner_tag: str,
        marketplace: str,
        region: str,
        host: str,
        session: requests.Session | None = None,
        min_interval_seconds: float = 1.0,
        max_throttle_retries: int = 4,
    ) -> None:
        self._access_key = access_key
        self._secret_key = secret_key
        self._partner_tag = partner_tag
        self._marketplace = marketplace
        self._region = region
        self._url = f"https://{host}/paapi5/searchitems"
        self._session = session or requests.Session()
        self._pacer = TokenBucketPacer(min_interval_seconds)
        self._max_throttle_retries = max_throttle_retries

    def search_items(
        self,
        keywords: str,
        *,
        item_count: int = 10,
        search_index: str = "All",
    ) -> list[dict[str, Any]]:
        body = build_search_items_body(
            keywords=keywords,
            marketplace=self._marketplace,
            partner_tag=self._partner_tag,
            search_index=search_index,
            item_count=item_count,
        )
        attempt = 0
        while True:
            self._pacer.wait_turn()
            headers = sign_paapi_post(
                url=self._url,
                body=body,
                access_key=self._access_key,
                secret_key=self._secret_key,
                region=self._region,
                target=SEARCH_ITEMS_TARGET,
            )
            headers.setdefault("Accept", "application/json")
            headers.setdefault("User-Agent", "DealASteal-paapi-worker/1")

            resp = self._session.post(self._url, headers=headers, data=body, timeout=30)
            try:
                raw = resp.json()
            except ValueError:
                raw = {}
            data = raw if isinstance(raw, dict) else {}

            codes = _error_codes_from_body(data)

            if resp.status_code == 200 and not codes:
                items = (
                    (data.get("SearchResult") or {}).get("Items")
                    if isinstance(data, dict)
                    else None
                )
                if not isinstance(items, list):
                    return []
                return [i for i in items if isinstance(i, dict)]

            if "RequestThrottled" in codes or resp.status_code == 429:
                if attempt >= self._max_throttle_retries:
                    log.warning(
                        "PA-API still throttled after retries",
                        extra={
                            "component": "amazon_paapi",
                            "keywords": keywords,
                            "error_code": "RequestThrottled",
                            "http_status": resp.status_code,
                        },
                    )
                    raise PaapiError(
                        "RequestThrottled",
                        codes=["RequestThrottled"],
                        http_status=resp.status_code,
                    )
                backoff = (2**attempt) * 0.5 + random.uniform(0, 0.25)
                time.sleep(backoff)
                attempt += 1
                continue

            if "InvalidParameterValue" in codes:
                log.warning(
                    "PA-API invalid parameters",
                    extra={
                        "component": "amazon_paapi",
                        "keywords": keywords,
                        "error_code": "InvalidParameterValue",
                        "http_status": resp.status_code,
                    },
                )
                raise PaapiError(
                    "InvalidParameterValue",
                    codes=codes,
                    http_status=resp.status_code,
                )

            log.error(
                "PA-API request failed",
                extra={
                    "component": "amazon_paapi",
                    "keywords": keywords,
                    "error_code": codes[0] if codes else None,
                    "http_status": resp.status_code,
                },
            )
            raise PaapiError(
                f"PA-API error: {codes or resp.status_code}",
                codes=codes,
                http_status=resp.status_code,
            )
