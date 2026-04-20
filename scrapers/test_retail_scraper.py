"""Unit tests for ``RetailDealScraper.scrape_deals`` (mocked HTTP)."""

from __future__ import annotations

import io
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Allow ``import retail_scraper`` / ``import base_scraper`` when running from repo root.
_SCRAPERS = Path(__file__).resolve().parent
if str(_SCRAPERS) not in sys.path:
    sys.path.insert(0, str(_SCRAPERS))

from retail_scraper import RetailDealScraper  # noqa: E402


_AMAZON_OK_HTML = """
<html><body>
  <span id="productTitle">Echo Dot (4th Gen) Smart speaker</span>
</body></html>
"""

_AMAZON_NO_TITLE_HTML = "<html><body><div>no title node</div></body></html>"


class TestRetailDealScraper(unittest.TestCase):
    @patch.dict("os.environ", {"INGESTION_API_KEY": "test-key"}, clear=False)
    @patch("retail_scraper.requests.get")
    def test_prints_status_and_skips_when_not_200(self, mock_get: MagicMock) -> None:
        mock_get.return_value = MagicMock(status_code=503, text="Service Unavailable")
        scraper = RetailDealScraper()
        buf = io.StringIO()
        with patch.object(sys, "stdout", buf):
            with patch.object(scraper, "push_to_api") as push:
                scraper.scrape_deals()
        push.assert_not_called()
        self.assertIn("HTTP status: 503", buf.getvalue())

    @patch.dict("os.environ", {"INGESTION_API_KEY": "test-key"}, clear=False)
    @patch("retail_scraper.requests.get")
    def test_no_push_when_product_title_missing(self, mock_get: MagicMock) -> None:
        mock_get.return_value = MagicMock(status_code=200, text=_AMAZON_NO_TITLE_HTML)
        scraper = RetailDealScraper()
        with patch.object(scraper, "push_to_api") as push:
            scraper.scrape_deals()
        push.assert_not_called()

    @patch.dict("os.environ", {"INGESTION_API_KEY": "test-key"}, clear=False)
    @patch("retail_scraper.requests.get")
    def test_pushes_with_placeholders_when_title_found(self, mock_get: MagicMock) -> None:
        mock_get.return_value = MagicMock(status_code=200, text=_AMAZON_OK_HTML)
        scraper = RetailDealScraper()
        with patch.object(scraper, "push_to_api") as push:
            scraper.scrape_deals()
        self.assertEqual(push.call_count, 1)
        payload = push.call_args[0][0]
        self.assertEqual(payload["title"], "Echo Dot (4th Gen) Smart speaker")
        self.assertEqual(payload["original_price"], 999.00)
        self.assertEqual(payload["discount_price"], 799.00)
        self.assertEqual(payload["affiliate_url"], RetailDealScraper._DEFAULT_PRODUCT_URL)
        self.assertTrue(payload["is_loot_deal"])

    @patch.dict("os.environ", {"INGESTION_API_KEY": "test-key"}, clear=False)
    @patch("retail_scraper.requests.get")
    def test_exits_on_captcha_heuristic(self, mock_get: MagicMock) -> None:
        mock_get.return_value = MagicMock(
            status_code=200,
            text="<html><body>Robot Check</body></html>",
        )
        scraper = RetailDealScraper()
        with patch.object(scraper, "push_to_api") as push:
            scraper.scrape_deals()
        push.assert_not_called()


if __name__ == "__main__":
    unittest.main()
