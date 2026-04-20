#!/usr/bin/env python3
"""
Simulated scraper that POSTs a single deal to the DealASteal Next.js ingest API.

Requires: pip install -r requirements.txt (from this directory)
Run Next.js locally first: npm run dev (serves http://localhost:3000 by default).
This script opens a short TCP connection to the ingest host/port before POSTing so
Windows “connection refused” (10061) is explained immediately when the dev server is off.

The hostname localhost is rewritten to 127.0.0.1 for checks and POSTs so Windows does not
try IPv6 (::1) first and hang until timeout while Next.js is listening on IPv4 only.
"""

from __future__ import annotations

import json
import os
import socket
import sys
from pathlib import Path
from typing import Any, Mapping, Optional, Tuple
from urllib.parse import urlparse, urlunparse

import requests
from dotenv import load_dotenv

_DEFAULT_ENDPOINT = "http://localhost:3010/api/ingest/deals"


def _load_env() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    load_dotenv(dotenv_path=repo_root / ".env.local", override=False)


def _ingest_url() -> str:
    return os.getenv("DEALASTEAL_INGEST_URL", _DEFAULT_ENDPOINT).strip() or _DEFAULT_ENDPOINT


def _prefer_ipv4_loopback_url(url: str) -> str:
    """Use IPv4 loopback when the URL says localhost — avoids ::1 hangs on Windows."""
    try:
        parsed = urlparse(url)
    except ValueError:
        return url
    if not parsed.hostname or parsed.hostname.lower() != "localhost":
        return url
    if parsed.port is not None:
        netloc = f"127.0.0.1:{parsed.port}"
    else:
        netloc = "127.0.0.1"
    return urlunparse(
        (parsed.scheme, netloc, parsed.path, parsed.params, parsed.query, parsed.fragment)
    )


def _parse_host_port(url: str) -> Tuple[str, int]:
    parsed = urlparse(url)
    host = parsed.hostname or "127.0.0.1"
    if parsed.port is not None:
        return host, parsed.port
    if parsed.scheme == "https":
        return host, 443
    return host, 80


def _ensure_tcp_reachable(url: str) -> Optional[int]:
    """
    Fail fast with a clear message when nothing is listening (e.g. Next.js not started).

    Returns an exit code to use, or None if the port accepts a TCP connection.
    """
    url_effective = _prefer_ipv4_loopback_url(url)
    host, port = _parse_host_port(url_effective)
    try:
        with socket.create_connection((host, port), timeout=2.0):
            return None
    except (OSError, TimeoutError) as exc:
        win = getattr(exc, "winerror", None)
        hint = ""
        if win == 10061:
            hint = (
                "\nWindows reported “connection actively refused” (10061): "
                "no process is listening on that port—usually `next dev` is not running.\n"
            )
        elif isinstance(exc, TimeoutError) or win == 10060:
            hint = (
                "\nConnection timed out. If you use `localhost` in the URL, this script "
                "already probes `127.0.0.1` for that. Confirm `npm run dev` is running and "
                "nothing is blocking port access (VPN/firewall).\n"
            )
        print(
            f"Cannot open a TCP connection to {host!r} port {port}.{hint}\n"
            "From the repository root (parent of the /scrapers folder), start the app:\n"
            "  npm run dev\n\n"
            "Then run this script again. Set DEALASTEAL_INGEST_URL if your dev server "
            "uses a different host or port.\n"
            f"Target URL: {url_effective}\n"
            f"Details: {exc}",
            file=sys.stderr,
        )
        return 1


def _ingestion_key() -> str:
    key = os.getenv("INGESTION_API_KEY", "").strip()
    if not key:
        print(
            "INGESTION_API_KEY is missing. Set it in .env.local at the repository root "
            "(parent of /scrapers), then retry.",
            file=sys.stderr,
        )
        sys.exit(1)
    return key


# Shape must match DealIngestSchema (Zod) in src/types/schemas.ts — strict keys only.
PAYLOAD: Mapping[str, Any] = {
    "merchant_id": "d12f961f-2336-4e66-820d-d513d7014324",  # TODO: replace with a real merchant UUID
    "title": "Sony PlayStation 5 Pro",
    "original_price": 499.00,
    "discount_price": 429.00,
    "affiliate_url": "https://walmart.com/ps5",
    "is_loot_deal": True,
}


def main() -> int:
    _load_env()
    api_endpoint = _prefer_ipv4_loopback_url(_ingest_url())
    secret_key = _ingestion_key()

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {secret_key}",
    }

    early = _ensure_tcp_reachable(api_endpoint)
    if early is not None:
        return early

    try:
        response = requests.post(
            api_endpoint,
            headers=headers,
            json=PAYLOAD,
            timeout=30,
        )
    except requests.exceptions.ConnectionError as exc:
        print(
            "HTTP request failed after TCP connect succeeded (proxy reset, TLS mismatch, or similar).\n"
            f"Target: {api_endpoint}\n"
            f"Details: {exc}",
            file=sys.stderr,
        )
        return 1
    except requests.RequestException as exc:
        print(f"Request failed: {exc}", file=sys.stderr)
        return 1

    print(f"HTTP status: {response.status_code}")

    try:
        body = response.json()
    except ValueError:
        print("Response body (non-JSON):", file=sys.stderr)
        print(response.text, file=sys.stderr)
        if response.status_code >= 500:
            print(
                "\nIf you see plain 'Internal Server Error', the Next.js dev server is often "
                "serving a broken .next cache. From the repo root run:\n"
                "  npm run clean\n"
                "  npm run dev\n"
                "Then run this script again.",
                file=sys.stderr,
            )
        return 1

    print(json.dumps(body, indent=2, sort_keys=True))
    return 0 if response.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
