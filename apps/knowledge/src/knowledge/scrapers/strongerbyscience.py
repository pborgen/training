import json
import logging
from collections.abc import Iterator
from datetime import datetime

import trafilatura
from selectolax.parser import HTMLParser

from ..models import Document
from .base import Scraper

log = logging.getLogger(__name__)

BASE = "https://www.strongerbyscience.com"
SITEMAP_INDEX = f"{BASE}/sitemap_index.xml"


class StrongerByScienceScraper(Scraper):
    """Pulls article URLs from the WordPress sitemap index, then extracts each article."""

    source = "strongerbyscience"

    def iter_documents(self, *, limit: int | None = None) -> Iterator[Document]:
        urls = self._discover_article_urls()
        if limit is not None:
            urls = urls[:limit]
        for url in urls:
            try:
                doc = self._fetch_article(url)
            except Exception as e:
                log.exception("failed to fetch %s: %s", url, e)
                continue
            if doc is not None:
                yield doc

    def _discover_article_urls(self) -> list[str]:
        """Walk the WordPress sitemap index to collect post URLs."""
        index_xml = self.client.get(SITEMAP_INDEX).text
        sub_sitemaps = _extract_locs(index_xml)
        post_sitemaps = [s for s in sub_sitemaps if "post-sitemap" in s]
        if not post_sitemaps:
            post_sitemaps = sub_sitemaps

        urls: list[str] = []
        seen: set[str] = set()
        for sm in post_sitemaps:
            xml = self.client.get(sm).text
            for loc in _extract_locs(xml):
                if loc in seen:
                    continue
                seen.add(loc)
                if _looks_like_article(loc):
                    urls.append(loc)
        log.info("discovered %d article URLs from sitemap", len(urls))
        return urls

    def _fetch_article(self, url: str) -> Document | None:
        resp = self.client.get(url)
        html = resp.text
        extracted = trafilatura.extract(
            html,
            include_comments=False,
            include_tables=True,
            with_metadata=True,
            output_format="json",
            url=url,
        )
        if not extracted:
            log.info("no extractable text at %s", url)
            return None
        data = json.loads(extracted)
        text = data.get("text")
        if not text:
            return None

        return Document(
            source=self.source,
            source_url=url,
            title=data.get("title"),
            author=data.get("author"),
            published_at=_parse_date(data.get("date")),
            category="general",
            raw_html=html,
            text=text,
            metadata={
                "description": data.get("description"),
                "tags": data.get("tags"),
                "categories": data.get("categories"),
                "sitename": data.get("sitename"),
            },
        )


def _extract_locs(xml: str) -> list[str]:
    tree = HTMLParser(xml)
    return [node.text(strip=True) for node in tree.css("loc") if node.text(strip=True)]


def _looks_like_article(url: str) -> bool:
    if not url.startswith(BASE):
        return False
    tail = url[len(BASE):].strip("/")
    if not tail:
        return False
    skip_prefixes = ("category/", "tag/", "author/", "page/", "wp-content/")
    return not any(tail.startswith(p) for p in skip_prefixes)


def _parse_date(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None
