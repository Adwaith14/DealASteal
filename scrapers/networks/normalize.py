"""Field normalization aligned with ``src/lib/vendors/amazon/map-paapi-item-to-ingest.ts``."""

from __future__ import annotations

import re
from typing import Any, TypedDict
from urllib.parse import quote

_ASIN_RE = re.compile(r"^[A-Z0-9]{10}$")
_GTIN_RE = re.compile(r"^\d{8,14}$")


class _TrustBundle(TypedDict):
    affiliate_network: str
    pipeline: str


def round_money(n: float) -> float:
    return round(n * 100.0) / 100.0


def normalize_currency_code(raw: str | None, *, default: str = "USD") -> str:
    if not raw or not isinstance(raw, str):
        return default
    s = raw.strip().upper()[:3]
    return s if len(s) == 3 else default


def extract_asin(value: str | None) -> str | None:
    if not value or not isinstance(value, str):
        return None
    s = value.strip().upper()
    return s if _ASIN_RE.fullmatch(s) else None


def normalize_gtin(value: str | None) -> str | None:
    if not value or not isinstance(value, str):
        return None
    s = value.strip()
    return s if _GTIN_RE.fullmatch(s) else None


def normalize_paapi_item(
    item: dict[str, Any],
    *,
    merchant_id: str,
    partner_tag: str,
) -> dict[str, Any] | None:
    """Return a ``DealIngestPayload``-shaped dict or ``None`` if unusable."""
    asin = extract_asin(item.get("ASIN"))
    if not asin:
        return None

    title = (item.get("ItemInfo") or {}).get("Title", {}).get("DisplayValue")
    title = (str(title).strip()[:500] if title else f"Amazon {asin}") or f"Amazon {asin}"

    listing = ((item.get("Offers") or {}).get("Listings") or [{}])[0]
    sale = (listing.get("Price") or {}).get("Amount")
    list_from_offer = (listing.get("SavingBasis") or {}).get("Amount")
    currency = normalize_currency_code((listing.get("Price") or {}).get("Currency"))

    if not (isinstance(sale, (int, float)) and sale > 0):
        return None

    discount_price = round_money(float(sale))
    if isinstance(list_from_offer, (int, float)) and list_from_offer >= discount_price:
        original_price = round_money(float(list_from_offer))
    else:
        original_price = round_money(max(discount_price * 1.1, discount_price))

    detail = item.get("DetailPageURL")
    detail_s = str(detail).strip() if detail else ""
    tag = partner_tag.strip()
    if detail_s.startswith("http") and "tag=" not in detail_s:
        sep = "&" if "?" in detail_s else "?"
        affiliate_url = f"{detail_s}{sep}tag={quote(tag, safe='')}"
    elif detail_s.startswith("http"):
        affiliate_url = detail_s
    else:
        affiliate_url = f"https://www.amazon.com/dp/{asin}?tag={tag}"

    image = (((item.get("Images") or {}).get("Primary") or {}).get("Large") or {}).get("URL")
    brand = ((item.get("ItemInfo") or {}).get("ByLineInfo") or {}).get("Brand", {}).get("DisplayValue")
    brand_s = str(brand).strip()[:200] if brand else None

    trust: _TrustBundle = {"affiliate_network": "amazon-paapi5", "pipeline": "paapi5-v1"}

    payload: dict[str, Any] = {
        "merchant_id": merchant_id,
        "title": title,
        "original_price": original_price,
        "discount_price": discount_price,
        "affiliate_url": affiliate_url,
        "is_loot_deal": original_price > discount_price * 1.25,
        "ingest_external_id": f"amazon:{asin}",
        "trust_bundle": trust,
        "currency": currency,
        "asin": asin,
    }
    if brand_s:
        payload["brand"] = brand_s
    if image:
        payload["image_url"] = str(image).strip()
    return payload


def normalize_walmart_item(item: dict[str, Any], *, merchant_id: str) -> dict[str, Any] | None:
    item_id = item.get("itemId")
    name = item.get("name")
    msrp = item.get("msrp")
    sale = item.get("salePrice")
    affiliate_url = item.get("affiliateAddToCartUrl") or item.get("productUrl")
    if item_id is None or not name or msrp is None or sale is None or not affiliate_url:
        return None
    try:
        msrp_f = float(msrp)
        sale_f = float(sale)
    except (TypeError, ValueError):
        return None
    if msrp_f <= 0 or sale_f <= 0 or sale_f >= msrp_f:
        return None

    ext_id = f"walmart:{item_id}"
    trust: _TrustBundle = {"affiliate_network": "walmart-affiliate", "pipeline": "open-api-v2"}

    payload: dict[str, Any] = {
        "merchant_id": merchant_id,
        "title": str(name)[:500],
        "original_price": round_money(msrp_f),
        "discount_price": round_money(sale_f),
        "affiliate_url": str(affiliate_url),
        "is_loot_deal": (msrp_f - sale_f) / msrp_f >= 0.50,
        "ingest_external_id": ext_id,
        "trust_bundle": trust,
        "currency": "USD",
    }
    if image_url := item.get("largeImage") or item.get("mediumImage"):
        payload["image_url"] = str(image_url)
    if rating := item.get("customerRating"):
        try:
            payload["rating"] = float(rating)
        except (TypeError, ValueError):
            pass
    if num_reviews := item.get("numReviews"):
        try:
            payload["rating_count"] = int(num_reviews)
        except (TypeError, ValueError):
            pass
    if brand := item.get("brandName"):
        payload["brand"] = str(brand)[:200]
    if stock := item.get("stock"):
        payload["availability"] = str(stock).lower()[:80]
    return payload


def normalize_ebay_browse_item(item: dict[str, Any], *, merchant_id: str) -> dict[str, Any] | None:
    """eBay Browse API ``item_summary`` row → ingest payload."""
    item_id = item.get("itemId")
    title = item.get("title")
    price = item.get("price") or {}
    marketing = item.get("marketingPrice") or {}
    original = marketing.get("originalPrice") or {}
    affiliate_url = item.get("itemAffiliateWebUrl") or item.get("itemWebUrl")

    try:
        sale_value = float(price.get("value", 0))
        msrp_value = float(original.get("value", 0)) if original else 0.0
    except (TypeError, ValueError):
        return None

    if not (item_id and title and affiliate_url and sale_value > 0):
        return None
    if msrp_value <= sale_value:
        return None

    trust: _TrustBundle = {"affiliate_network": "ebay-browse", "pipeline": "browse-v1"}

    payload: dict[str, Any] = {
        "merchant_id": merchant_id,
        "title": str(title)[:500],
        "original_price": round_money(msrp_value),
        "discount_price": round_money(sale_value),
        "affiliate_url": str(affiliate_url),
        "is_loot_deal": (msrp_value - sale_value) / msrp_value >= 0.50,
        "ingest_external_id": f"ebay:{item_id}",
        "trust_bundle": trust,
        "currency": normalize_currency_code(price.get("currency") if isinstance(price.get("currency"), str) else None),
    }
    if image := (item.get("image") or {}).get("imageUrl"):
        payload["image_url"] = str(image)
    if condition := item.get("condition"):
        payload["availability"] = str(condition).lower()[:80]
    return payload


def normalize_bestbuy_impact_item(item: dict[str, Any], *, merchant_id: str) -> dict[str, Any] | None:
    """Impact / catalog JSON row (fixture or HTTPS feed) for Best Buy."""
    sku = item.get("sku") or item.get("bestbuy_sku")
    title = item.get("title") or item.get("name")
    list_p = item.get("list_price") if item.get("list_price") is not None else item.get("msrp")
    sale_p = item.get("sale_price") if item.get("sale_price") is not None else item.get("current_price")
    url = item.get("affiliate_url") or item.get("url")
    if sku is None or not title or list_p is None or sale_p is None or not url:
        return None
    try:
        msrp_f = float(list_p)
        sale_f = float(sale_p)
    except (TypeError, ValueError):
        return None
    if msrp_f <= 0 or sale_f <= 0 or sale_f >= msrp_f:
        return None
    ext = f"bestbuy:{sku}"
    trust: _TrustBundle = {"affiliate_network": "bestbuy-impact", "pipeline": "impact-catalog-v1"}
    payload: dict[str, Any] = {
        "merchant_id": merchant_id,
        "title": str(title)[:500],
        "original_price": round_money(msrp_f),
        "discount_price": round_money(sale_f),
        "affiliate_url": str(url),
        "is_loot_deal": (msrp_f - sale_f) / msrp_f >= 0.40,
        "ingest_external_id": ext,
        "trust_bundle": trust,
        "currency": normalize_currency_code(str(item.get("currency") or "USD")),
    }
    if img := item.get("image_url"):
        payload["image_url"] = str(img)
    if brand := item.get("brand"):
        payload["brand"] = str(brand)[:200]
    return payload


def normalize_target_impact_item(item: dict[str, Any], *, merchant_id: str) -> dict[str, Any] | None:
    """Impact / catalog JSON row for Target (same shape as Best Buy fixture)."""
    sku = item.get("sku") or item.get("tcin")
    title = item.get("title") or item.get("name")
    list_p = item.get("list_price") if item.get("list_price") is not None else item.get("msrp")
    sale_p = item.get("sale_price") if item.get("sale_price") is not None else item.get("current_price")
    url = item.get("affiliate_url") or item.get("url")
    if sku is None or not title or list_p is None or sale_p is None or not url:
        return None
    try:
        msrp_f = float(list_p)
        sale_f = float(sale_p)
    except (TypeError, ValueError):
        return None
    if msrp_f <= 0 or sale_f <= 0 or sale_f >= msrp_f:
        return None
    ext = f"target:{sku}"
    trust: _TrustBundle = {"affiliate_network": "target-impact", "pipeline": "impact-catalog-v1"}
    payload: dict[str, Any] = {
        "merchant_id": merchant_id,
        "title": str(title)[:500],
        "original_price": round_money(msrp_f),
        "discount_price": round_money(sale_f),
        "affiliate_url": str(url),
        "is_loot_deal": (msrp_f - sale_f) / msrp_f >= 0.40,
        "ingest_external_id": ext,
        "trust_bundle": trust,
        "currency": normalize_currency_code(str(item.get("currency") or "USD")),
    }
    if img := item.get("image_url"):
        payload["image_url"] = str(img)
    if brand := item.get("brand"):
        payload["brand"] = str(brand)[:200]
    return payload
