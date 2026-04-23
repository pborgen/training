from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Document:
    source: str
    source_url: str
    title: str | None = None
    author: str | None = None
    published_at: datetime | None = None
    category: str | None = None
    raw_html: str | None = None
    text: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
