"""RSA PKCS#1 v1.5 + SHA256 signing for Walmart Affiliate / Open API headers."""

from __future__ import annotations

import base64
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def walmart_auth_message(*, consumer_id: str, timestamp_ms: str, key_version: str) -> bytes:
    """Canonical newline-delimited string (order matters)."""
    return f"{consumer_id}\n{timestamp_ms}\n{key_version}\n".encode("utf-8")


def load_private_key_pem(path: str | Path):
    raw = Path(path).read_bytes()
    return serialization.load_pem_private_key(raw, password=None)


def sign_walmart_auth(private_key, message: bytes) -> str:
    sig = private_key.sign(message, padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(sig).decode("ascii")


def build_walmart_headers(
    *,
    consumer_id: str,
    key_version: str,
    private_key_path: str | Path,
    timestamp_ms: str,
) -> dict[str, str]:
    key = load_private_key_pem(private_key_path)
    msg = walmart_auth_message(consumer_id=consumer_id, timestamp_ms=timestamp_ms, key_version=key_version)
    signature = sign_walmart_auth(key, msg)
    return {
        "WM_CONSUMER.ID": consumer_id,
        "WM_CONSUMER.INTIMESTAMP": timestamp_ms,
        "WM_SEC.KEY_VERSION": key_version,
        "WM_SEC.AUTH_SIGNATURE": signature,
        "WM_QOS.CORRELATION_ID": "dealasteal-worker",
        "Accept": "application/json",
        "User-Agent": "DealASteal-walmart-worker/1",
    }
