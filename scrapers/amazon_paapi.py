#!/usr/bin/env python3
"""Amazon Product Advertising API (PA-API 5.0) ingest worker.

Uses AWS SigV4 (``botocore``) against ``/paapi5/searchitems``, enforces ~1 TPS
client-side, retries ``RequestThrottled``, and logs ``InvalidParameterValue``.
"""

from __future__ import annotations

import logging
import os
import sys

from base_scraper import BaseDealScraper, DealIngestPayload

from networks.ingest_gate import check_ingest_enabled_or_exit
from networks.normalize import normalize_paapi_item
from networks.paapi_client import PaapiClient, PaapiError
from networks.worker_logging import configure_worker_logging

log = logging.getLogger("dealasteal.amazon_paapi")


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        log.error(
            "missing env var: %s",
            name,
            extra={"component": "amazon_paapi", "exception_type": "config", "msg_key": name},
        )
        print(f"[amazon_paapi] Missing env var {name!r}. See scrapers/README.md.", file=sys.stderr, flush=True)
        sys.exit(1)
    return value


def main() -> int:
    configure_worker_logging()
    check_ingest_enabled_or_exit("amazon", log=log, component="amazon_paapi")
    merchant_id = _required_env("AMAZON_MERCHANT_ID")
    access_key = _required_env("AMAZON_PAAPI_ACCESS_KEY")
    secret_key = _required_env("AMAZON_PAAPI_SECRET_KEY")
    partner_tag = _required_env("AMAZON_PAAPI_PARTNER_TAG")
    _ = _required_env("INGESTION_API_KEY")

    host = os.getenv("AMAZON_PAAPI_HOST", "webservices.amazon.com").strip()
    region = os.getenv("AMAZON_PAAPI_REGION", "us-east-1").strip()
    marketplace = os.getenv("AMAZON_PAAPI_MARKETPLACE", "www.amazon.com").strip()
    min_interval = float(os.getenv("AMAZON_PAAPI_MIN_INTERVAL", "1.0").strip() or "1.0")

    client = PaapiClient(
        access_key=access_key,
        secret_key=secret_key,
        partner_tag=partner_tag,
        marketplace=marketplace,
        region=region,
        host=host,
        min_interval_seconds=min_interval,
    )
    scraper = BaseDealScraper()
    queries = ["laptop deals", "smart tv", "kitchen sale", "headphones"]

    sent = 0
    for query in queries:
        try:
            raw_items = client.search_items(query)
        except PaapiError as exc:
            log.warning(
                "search_items failed",
                extra={
                    "component": "amazon_paapi",
                    "keywords": query,
                    "error_code": exc.codes[0] if exc.codes else None,
                    "http_status": exc.http_status,
                },
            )
            continue
        log.info(
            "search_items ok",
            extra={"component": "amazon_paapi", "keywords": query, "items": len(raw_items)},
        )
        for item in raw_items:
            normalized = normalize_paapi_item(item, merchant_id=merchant_id, partner_tag=partner_tag)
            if normalized is None:
                continue
            payload: DealIngestPayload = normalized  # type: ignore[assignment]
            if scraper.push_to_api(dict(payload)):
                sent += 1

    log.info("run complete", extra={"component": "amazon_paapi", "sent": sent})
    print(f"[amazon_paapi] Sent {sent} deal(s).", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
