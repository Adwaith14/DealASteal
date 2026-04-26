#!/usr/bin/env python3
"""Best Buy via Impact (or compatible) catalog — JSON array URL or local fixture path."""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

import requests

from base_scraper import BaseDealScraper, DealIngestPayload

from networks.ingest_gate import check_ingest_enabled_or_exit
from networks.normalize import normalize_bestbuy_impact_item
from networks.worker_logging import configure_worker_logging

log = logging.getLogger("dealasteal.bestbuy_impact")


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        log.error("missing env var: %s", name, extra={"component": "bestbuy_impact", "msg_key": name})
        print(f"[bestbuy_impact] Missing env var {name!r}. See scrapers/README.md.", file=sys.stderr, flush=True)
        sys.exit(1)
    return value


def _load_items() -> list[dict[str, Any]]:
    fixture = os.getenv("BESTBUY_IMPACT_FIXTURE_PATH", "").strip()
    url = os.getenv("BESTBUY_IMPACT_CATALOG_URL", "").strip()
    if fixture:
        raw = Path(fixture).expanduser().read_text(encoding="utf-8")
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    if url:
        headers: dict[str, str] = {}
        tok = os.getenv("BESTBUY_IMPACT_BEARER", "").strip()
        if tok:
            headers["Authorization"] = f"Bearer {tok}"
        r = requests.get(url, headers=headers, timeout=120)
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else []
    log.error("set BESTBUY_IMPACT_FIXTURE_PATH or BESTBUY_IMPACT_CATALOG_URL", extra={"component": "bestbuy_impact"})
    print("[bestbuy_impact] Set BESTBUY_IMPACT_FIXTURE_PATH or BESTBUY_IMPACT_CATALOG_URL.", file=sys.stderr, flush=True)
    sys.exit(1)


def main() -> int:
    configure_worker_logging()
    check_ingest_enabled_or_exit("bestbuy", log=log, component="bestbuy_impact")
    merchant_id = _required_env("BESTBUY_MERCHANT_ID")
    _ = _required_env("INGESTION_API_KEY")

    scraper = BaseDealScraper()
    sent = 0
    try:
        items = _load_items()
    except (OSError, json.JSONDecodeError, requests.RequestException) as exc:
        log.error("load failed", extra={"component": "bestbuy_impact", "err": str(exc)})
        print(f"[bestbuy_impact] Load error: {exc}", file=sys.stderr, flush=True)
        return 1

    log.info("catalog rows", extra={"component": "bestbuy_impact", "items": len(items)})
    for item in items:
        if not isinstance(item, dict):
            continue
        normalized = normalize_bestbuy_impact_item(item, merchant_id=merchant_id)
        if normalized is None:
            continue
        payload: DealIngestPayload = normalized  # type: ignore[assignment]
        if scraper.push_to_api(dict(payload)):
            sent += 1

    log.info("run complete", extra={"component": "bestbuy_impact", "sent": sent})
    print(f"[bestbuy_impact] Sent {sent} deal(s).", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
