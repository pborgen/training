from .base import Scraper
from .strongerbyscience import StrongerByScienceScraper

SCRAPERS: dict[str, type[Scraper]] = {
    StrongerByScienceScraper.source: StrongerByScienceScraper,
}

__all__ = ["Scraper", "SCRAPERS"]
