#!/usr/bin/env python3
"""eBay Partner Network — Browse API ingest worker (OAuth + search)."""

from __future__ import annotations

import logging
import os
import sys

from base_scraper import BaseDealScraper, DealIngestPayload

from networks.ebay_client import EbayBrowseClient, EbayHttpError
from networks.ingest_gate import check_ingest_enabled_or_exit
from networks.normalize import normalize_ebay_browse_item
from networks.worker_logging import configure_worker_logging

log = logging.getLogger("dealasteal.ebay_partner")


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        log.error("missing env var: %s", name, extra={"component": "ebay_partner", "msg_key": name})
        print(f"[ebay_partner] Missing env var {name!r}. See scrapers/README.md.", file=sys.stderr, flush=True)
        sys.exit(1)
    return value


def main() -> int:
    configure_worker_logging()
    check_ingest_enabled_or_exit("ebay", log=log, component="ebay_partner")

    merchant_id = _required_env("EBAY_MERCHANT_ID")
    client_id = _required_env("EBAY_CLIENT_ID")
    client_secret = _required_env("EBAY_CLIENT_SECRET")
    campaign_id = _required_env("EBAY_CAMPAIGN_ID")
    _ = _required_env("INGESTION_API_KEY")

    query = os.getenv("EBAY_SEARCH_QUERY", "electronics deals").strip() or "electronics deals"
    limit = int(os.getenv("EBAY_SEARCH_LIMIT", "20").strip() or "20")
    marketplace = os.getenv("EBAY_MARKETPLACE_ID", "EBAY_US").strip() or "EBAY_US"

    client = EbayBrowseClient(
        client_id=client_id,
        client_secret=client_secret,
        campaign_id=campaign_id,
        marketplace_id=marketplace,
        min_interval_seconds=float(os.getenv("EBAY_MIN_INTERVAL", "0.35") or "0.35"),
    )
    scraper = BaseDealScraper()
    sent = 0
    try:
        items = client.search_item_summaries(q=query, limit=limit)
    except EbayHttpError as exc:
        log.error(
            "ebay search failed",
            extra={"component": "ebay_partner", "http_status": exc.http_status},
        )
        print(f"[ebay_partner] API error: {exc}", file=sys.stderr, flush=True)
        return 1

    log.info("search ok", extra={"component": "ebay_partner", "items": len(items), "q": query})
    for item in items:
        normalized = normalize_ebay_browse_item(item, merchant_id=merchant_id)
        if normalized is None:
            continue
        payload: DealIngestPayload = normalized  # type: ignore[assignment]
        if scraper.push_to_api(dict(payload)):
            sent += 1

    log.info("run complete", extra={"component": "ebay_partner", "sent": sent})
    print(f"[ebay_partner] Sent {sent} deal(s).", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
