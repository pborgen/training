from abc import ABC, abstractmethod
from collections.abc import Iterator

from ..http import PoliteClient
from ..models import Document


class Scraper(ABC):
    source: str

    def __init__(self, client: PoliteClient):
        self.client = client

    @abstractmethod
    def iter_documents(self, *, limit: int | None = None) -> Iterator[Document]:
        ...
