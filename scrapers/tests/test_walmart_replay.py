from __future__ import annotations

import json
from pathlib import Path

import responses

from networks.walmart_client import WalmartAffiliateClient


@responses.activate
def test_walmart_feed_replay(tmp_path: Path) -> None:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = tmp_path / "wm.pem"
    pem.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )

    fixture = Path(__file__).parent / "fixtures" / "walmart_feed_items.json"
    body = json.loads(fixture.read_text(encoding="utf-8"))

    responses.add(
        responses.GET,
        "https://developer.api.walmart.com/api-proxy/service/affil/product/v2/feeds/specialbuys",
        json=body,
        status=200,
    )

    client = WalmartAffiliateClient(
        consumer_id="00000000-0000-4000-8000-000000000099",
        key_version="1",
        private_key_path=str(pem),
        min_interval_seconds=0.0,
    )
    items = client.get_feed_items()
    assert len(items) == 1
    assert items[0].get("itemId") == 50001234
