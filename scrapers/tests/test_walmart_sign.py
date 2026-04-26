from __future__ import annotations

import base64
from pathlib import Path

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives import serialization

from networks import walmart_sign


def test_walmart_auth_message_format() -> None:
    assert (
        walmart_sign.walmart_auth_message(
            consumer_id="cid",
            timestamp_ms="123",
            key_version="2",
        )
        == b"cid\n123\n2\n"
    )


def test_sign_walmart_matches_crypto_verify(tmp_path: Path) -> None:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem_path = tmp_path / "key.pem"
    pem_path.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    msg = walmart_sign.walmart_auth_message(
        consumer_id="11111111-1111-1111-1111-111111111111",
        timestamp_ms="1440058729000",
        key_version="1",
    )
    b64 = walmart_sign.sign_walmart_auth(walmart_sign.load_private_key_pem(pem_path), msg)
    sig = base64.b64decode(b64)
    key.public_key().verify(sig, msg, padding.PKCS1v15(), hashes.SHA256())
