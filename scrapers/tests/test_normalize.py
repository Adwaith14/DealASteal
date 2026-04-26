from __future__ import annotations

import pytest

import json
from pathlib import Path

from networks.normalize import (
    extract_asin,
    normalize_bestbuy_impact_item,
    normalize_currency_code,
    normalize_ebay_browse_item,
    normalize_paapi_item,
    normalize_target_impact_item,
    normalize_walmart_item,
    round_money,
)


def test_round_money() -> None:
    assert round_money(1.234) == 1.23


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("usd", "USD"),
        ("  eur\n", "EUR"),
        ("", "USD"),
        (None, "USD"),
    ],
)
def test_normalize_currency_code(raw: str | None, expected: str) -> None:
    assert normalize_currency_code(raw) == expected


@pytest.mark.parametrize(
    "value,expected",
    [
        ("B00TEST123", "B00TEST123"),
        ("  b00test123 ", "B00TEST123"),
        ("short", None),
        ("B00TEST12345", None),
    ],
)
def test_extract_asin(value: str, expected: str | None) -> None:
    assert extract_asin(value) == expected


def test_normalize_paapi_item_applies_partner_tag() -> None:
    item = {
        "ASIN": "B012345678",
        "DetailPageURL": "https://www.amazon.com/dp/B012345678?ref=foo",
        "ItemInfo": {"Title": {"DisplayValue": "Thing"}},
        "Offers": {"Listings": [{"Price": {"Amount": 10.0, "Currency": "USD"}}]},
    }
    out = normalize_paapi_item(item, merchant_id="00000000-0000-4000-8000-000000000001", partner_tag="mytag-20")
    assert out is not None
    assert "tag=mytag-20" in out["affiliate_url"]
    assert out["ingest_external_id"] == "amazon:B012345678"
    assert out["trust_bundle"]["affiliate_network"] == "amazon-paapi5"


def test_normalize_ebay_browse_item() -> None:
    fixture = Path(__file__).parent / "fixtures" / "ebay_browse_search.json"
    item = json.loads(fixture.read_text(encoding="utf-8"))["itemSummaries"][0]
    out = normalize_ebay_browse_item(item, merchant_id="00000000-0000-4000-8000-000000000003")
    assert out is not None
    assert out["ingest_external_id"] == "ebay:v1|987654321|0"
    assert out["trust_bundle"]["affiliate_network"] == "ebay-browse"


def test_normalize_bestbuy_impact_fixture() -> None:
    fixture = Path(__file__).parent / "fixtures" / "bestbuy_impact_catalog.json"
    row = json.loads(fixture.read_text(encoding="utf-8"))[0]
    out = normalize_bestbuy_impact_item(row, merchant_id="00000000-0000-4000-8000-000000000004")
    assert out is not None
    assert out["ingest_external_id"] == "bestbuy:BB-10001"


def test_normalize_target_impact_fixture() -> None:
    fixture = Path(__file__).parent / "fixtures" / "target_impact_catalog.json"
    row = json.loads(fixture.read_text(encoding="utf-8"))[0]
    out = normalize_target_impact_item(row, merchant_id="00000000-0000-4000-8000-000000000005")
    assert out is not None
    assert out["ingest_external_id"] == "target:TCIN-9001"


def test_normalize_walmart_item() -> None:
    row = {
        "itemId": 99,
        "name": "Kettle",
        "msrp": 40.0,
        "salePrice": 20.0,
        "productUrl": "https://www.walmart.com/ip/kettle/99",
    }
    out = normalize_walmart_item(row, merchant_id="00000000-0000-4000-8000-000000000002")
    assert out is not None
    assert out["ingest_external_id"] == "walmart:99"
    assert out["trust_bundle"]["pipeline"] == "open-api-v2"
