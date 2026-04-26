from __future__ import annotations

import hashlib

from networks.paapi_sign import build_search_items_body


def test_search_items_body_stable_sha256() -> None:
    body = build_search_items_body(
        keywords="laptop deals",
        marketplace="www.amazon.com",
        partner_tag="assoc-20",
    )
    assert (
        hashlib.sha256(body).hexdigest()
        == "fe86c74c3927aa0e7d4d718af9d9ed4e8b196225326ebbcce999694d98d2011b"
    )


def test_sign_paapi_post_returns_authorization() -> None:
    from networks.paapi_sign import sign_paapi_post

    body = build_search_items_body(
        keywords="q",
        marketplace="www.amazon.com",
        partner_tag="t-20",
    )
    headers = sign_paapi_post(
        url="https://webservices.amazon.com/paapi5/searchitems",
        body=body,
        access_key="AKIAIOSFODNN7EXAMPLE",
        secret_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        region="us-east-1",
    )
    auth = headers.get("Authorization") or headers.get("authorization")
    assert auth
    assert auth.startswith("AWS4-HMAC-SHA256")
    assert "SignedHeaders=" in auth
    assert "Signature=" in auth
