import os
from contextlib import contextmanager

import psycopg
from psycopg.types.json import Json

from .models import Document

SCHEMA_SQL = """
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    source_url TEXT NOT NULL UNIQUE,
    title TEXT,
    author TEXT,
    published_at TIMESTAMPTZ,
    category TEXT,
    raw_html TEXT,
    text TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS knowledge_documents_source_idx ON knowledge_documents (source);
CREATE INDEX IF NOT EXISTS knowledge_documents_category_idx ON knowledge_documents (category);
CREATE INDEX IF NOT EXISTS knowledge_documents_unprocessed_idx
    ON knowledge_documents (scraped_at) WHERE processed_at IS NULL;
"""


def _dsn() -> str:
    url = os.environ.get("POSTGRES_URL")
    if not url:
        raise RuntimeError("POSTGRES_URL is not set")
    return url


@contextmanager
def connect():
    with psycopg.connect(_dsn()) as conn:
        yield conn


def ensure_schema() -> None:
    with connect() as conn, conn.cursor() as cur:
        cur.execute(SCHEMA_SQL)
        conn.commit()


def upsert_document(doc: Document) -> bool:
    """Insert if new. Returns True when a row was inserted, False if the URL already existed."""
    with connect() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO knowledge_documents
                (source, source_url, title, author, published_at, category,
                 raw_html, text, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (source_url) DO NOTHING
            RETURNING id
            """,
            (
                doc.source,
                doc.source_url,
                doc.title,
                doc.author,
                doc.published_at,
                doc.category,
                doc.raw_html,
                doc.text,
                Json(doc.metadata),
            ),
        )
        row = cur.fetchone()
        conn.commit()
        return row is not None
