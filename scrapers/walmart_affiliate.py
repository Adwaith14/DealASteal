#!/usr/bin/env python3
"""Walmart Affiliate / Open API ingest worker.

Signs each feed request (``WM_CONSUMER.ID`` + RSA-SHA256 per Walmart Affiliate
onboarding docs) and maps JSON items to ``DealIngestPayload``.
"""

from __future__ import annotations

import logging
import os
import sys

from base_scraper import BaseDealScraper, DealIngestPayload

from networks.ingest_gate import check_ingest_enabled_or_exit
from networks.normalize import normalize_walmart_item
from networks.walmart_client import WalmartAffiliateClient, WalmartHttpError
from networks.worker_logging import configure_worker_logging

log = logging.getLogger("dealasteal.walmart_affiliate")


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        log.error(
            "missing env var: %s",
            name,
            extra={"component": "walmart_affiliate", "exception_type": "config", "msg_key": name},
        )
        print(f"[walmart_affiliate] Missing env var {name!r}. See scrapers/README.md.", file=sys.stderr, flush=True)
        sys.exit(1)
    return value


def main() -> int:
    configure_worker_logging()
    check_ingest_enabled_or_exit("walmart", log=log, component="walmart_affiliate")
    merchant_id = _required_env("WALMART_MERCHANT_ID")
    consumer_id = _required_env("WALMART_CONSUMER_ID")
    key_path = _required_env("WALMART_PRIVATE_KEY_PATH")
    key_version = _required_env("WALMART_KEY_VERSION")
    _ = _required_env("INGESTION_API_KEY")

    api_base = os.getenv("WALMART_API_BASE", "https://developer.api.walmart.com").strip()
    feed_path = os.getenv("WALMART_FEED_PATH", WalmartAffiliateClient.FEED_SPECIALBUYS).strip()

    client = WalmartAffiliateClient(
        consumer_id=consumer_id,
        key_version=key_version,
        private_key_path=key_path,
        api_base=api_base,
    )
    scraper = BaseDealScraper()
    sent = 0
    try:
        items = client.get_feed_items(feed_path=feed_path)
    except WalmartHttpError as exc:
        log.error(
            "feed fetch failed",
            extra={
                "component": "walmart_affiliate",
                "http_status": exc.http_status,
                "feed": feed_path,
            },
        )
        print(f"[walmart_affiliate] Feed error: {exc}", file=sys.stderr, flush=True)
        return 1

    log.info("feed ok", extra={"component": "walmart_affiliate", "feed": feed_path, "items": len(items)})
    for item in items:
        normalized = normalize_walmart_item(item, merchant_id=merchant_id)
        if normalized is None:
            continue
        payload: DealIngestPayload = normalized  # type: ignore[assignment]
        if scraper.push_to_api(dict(payload)):
            sent += 1

    log.info("run complete", extra={"component": "walmart_affiliate", "sent": sent})
    print(f"[walmart_affiliate] Sent {sent} deal(s).", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
