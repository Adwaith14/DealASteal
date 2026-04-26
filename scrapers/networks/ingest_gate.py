"""Optional remote kill-switch: ``GET /api/ingest/network-config`` (ingestion bearer)."""

from __future__ import annotations

import logging
import os
import sys

import requests


def check_ingest_enabled_or_exit(network_slug: str, *, log: logging.Logger, component: str) -> None:
    """Exit 0 when ingest is disabled for ``network_slug``; no-op if gate skipped or unreachable."""
    if os.getenv("INGEST_SKIP_NETWORK_GATE", "").strip() == "1":
        return

    base = os.getenv("DEALASTEAL_BASE_URL", "").strip()
    key = os.getenv("INGESTION_API_KEY", "").strip()
    if not base or not key:
        return

    url = f"{base.rstrip('/')}/api/ingest/network-config"
    try:
        r = requests.get(url, headers={"Authorization": f"Bearer {key}"}, timeout=20)
    except requests.RequestException as exc:
        log.warning(
            "network-config unreachable; continuing ingest",
            extra={"component": component, "network": network_slug, "err": str(exc)},
        )
        return

    if r.status_code != 200:
        log.warning(
            "network-config non-200; continuing ingest",
            extra={"component": component, "network": network_slug, "status": r.status_code},
        )
        return

    try:
        payload = r.json()
    except ValueError:
        log.warning("network-config invalid json", extra={"component": component})
        return

    net = (payload.get("networks") or {}).get(network_slug) or {}
    if net.get("ingestEnabled") is False:
        log.info("ingest disabled for network", extra={"component": component, "network": network_slug})
        sys.exit(0)
