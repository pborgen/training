import logging
import os
import time
from collections import defaultdict
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential_jitter

log = logging.getLogger(__name__)

DEFAULT_USER_AGENT = "PFATrainingKnowledgeBot/0.1 (+https://example.com/contact)"


class PoliteClient:
    """Synchronous httpx client with per-host rate limiting and robots.txt enforcement."""

    def __init__(self, *, user_agent: str | None = None, min_delay: float = 1.5):
        self.user_agent = user_agent or os.environ.get("USER_AGENT", DEFAULT_USER_AGENT)
        self.min_delay = min_delay
        self._client = httpx.Client(
            headers={"User-Agent": self.user_agent},
            timeout=30.0,
            follow_redirects=True,
        )
        self._last_request: dict[str, float] = defaultdict(float)
        self._robots: dict[str, RobotFileParser] = {}

    def _robots_for(self, url: str) -> RobotFileParser:
        parsed = urlparse(url)
        host = f"{parsed.scheme}://{parsed.netloc}"
        rp = self._robots.get(host)
        if rp is None:
            rp = RobotFileParser()
            rp.set_url(f"{host}/robots.txt")
            try:
                rp.read()
            except Exception as e:
                log.warning("could not read robots.txt for %s: %s", host, e)
            self._robots[host] = rp
        return rp

    def can_fetch(self, url: str) -> bool:
        return self._robots_for(url).can_fetch(self.user_agent, url)

    def _wait(self, url: str) -> None:
        host = urlparse(url).netloc
        elapsed = time.monotonic() - self._last_request[host]
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        self._last_request[host] = time.monotonic()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter(initial=1, max=10))
    def get(self, url: str) -> httpx.Response:
        if not self.can_fetch(url):
            raise RuntimeError(f"robots.txt disallows fetching {url}")
        self._wait(url)
        resp = self._client.get(url)
        resp.raise_for_status()
        return resp

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "PoliteClient":
        return self

    def __exit__(self, *args) -> None:
        self.close()
